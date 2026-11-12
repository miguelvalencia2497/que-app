import { FRIEND_COLORS } from '../shared/constants';
import type {
  ErrorCode,
  FriendColor,
  Playback,
  QueueItem,
  RoomSnapshot,
  Settings,
  Video,
} from '../shared/types';

/** A member as stored by the room (online status is worked out from open sockets). */
export type StoredMember = {
  clientId: string;
  name: string;
  color: FriendColor;
  isHost: boolean;
};

/** Full room state as persisted in the Durable Object. Contains secrets; never send as-is. */
export type RoomState = {
  code: string;
  hostToken: string;
  tvToken: string;
  createdAt: number;
  lastActivity: number;
  settings: Settings;
  members: StoredMember[];
  nowPlaying: QueueItem | null;
  queue: QueueItem[];
  playback: Playback;
};

/** Who sent an action. `role: 'tv'` is only given to sockets that proved the TV token. */
export type Actor = {
  clientId: string;
  role: 'phone' | 'tv';
  isHost: boolean;
};

/** Validated actions, after the Worker has looked up any video details. */
export type RoomAction =
  | { type: 'join'; name: string }
  | { type: 'add'; video: Video }
  | { type: 'remove'; itemId: string }
  | { type: 'reorder'; itemId: string; toIndex: number }
  | { type: 'control'; action: 'play' | 'pause' | 'skip' }
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'tv:ended'; itemId: string }
  | { type: 'tv:error'; itemId: string }
  | { type: 'tv:progress'; positionSec: number };

export type ActionResult =
  | { ok: true; state: RoomState }
  | { ok: false; code: ErrorCode; message: string };

/** Injected so the logic stays pure and testable. */
export type LogicDeps = {
  now: number;
  newId: () => string;
};

export const DEFAULT_SETTINGS: Settings = { guestControls: false, perPersonLimit: null };

export function createRoomState(
  code: string,
  tokens: { hostToken: string; tvToken: string },
  now: number,
): RoomState {
  return {
    code,
    ...tokens,
    createdAt: now,
    lastActivity: now,
    settings: DEFAULT_SETTINGS,
    members: [],
    nowPlaying: null,
    queue: [],
    playback: { status: 'playing', positionSec: 0, updatedAt: now },
  };
}

function fail(code: ErrorCode, message: string): ActionResult {
  return { ok: false, code, message };
}

function canControlPlayback(state: RoomState, actor: Actor): boolean {
  return actor.isHost || actor.role === 'tv' || state.settings.guestControls;
}

/** Moves the next queued video into "now playing" (or clears it when the queue is empty). */
function advance(state: RoomState, now: number): RoomState {
  const [next, ...rest] = state.queue;
  return {
    ...state,
    nowPlaying: next ?? null,
    queue: rest,
    playback: { status: 'playing', positionSec: 0, updatedAt: now },
  };
}

/** Number of videos a person has waiting (the one playing doesn't count toward the limit). */
export function queuedCount(state: RoomState, clientId: string): number {
  return state.queue.filter((item) => item.addedBy === clientId).length;
}

/**
 * Applies one action from one actor and returns the next state, or an error explaining why the
 * action isn't allowed. This is the single place room rules are enforced (requirements R2–R5).
 */
export function applyAction(
  state: RoomState,
  action: RoomAction,
  actor: Actor,
  deps: LogicDeps,
): ActionResult {
  const touched = { ...state, lastActivity: deps.now };
  const member = state.members.find((m) => m.clientId === actor.clientId);

  if (action.type === 'join') {
    if (member) {
      const members = state.members.map((m) =>
        m.clientId === actor.clientId ? { ...m, name: action.name, isHost: actor.isHost } : m,
      );
      return { ok: true, state: { ...touched, members } };
    }
    const color = FRIEND_COLORS[state.members.length % FRIEND_COLORS.length] ?? 'coral';
    const newMember: StoredMember = {
      clientId: actor.clientId,
      name: action.name,
      color,
      isHost: actor.isHost,
    };
    return { ok: true, state: { ...touched, members: [...state.members, newMember] } };
  }

  // The TV never joins as a member; every other action needs a joined member.
  if (!member && actor.role !== 'tv') return fail('not_joined', 'Join the room first.');

  switch (action.type) {
    case 'add': {
      if (!member) return fail('forbidden', 'The TV can’t add videos.');
      const limit = state.settings.perPersonLimit;
      if (!actor.isHost && limit !== null && queuedCount(state, actor.clientId) >= limit) {
        return fail(
          'limit_reached',
          `You have ${limit} video${limit === 1 ? '' : 's'} queued. Wait for one to play.`,
        );
      }
      const item: QueueItem = {
        ...action.video,
        id: deps.newId(),
        addedBy: member.clientId,
        addedByName: member.name,
        color: member.color,
        addedAt: deps.now,
      };
      if (!state.nowPlaying) {
        return {
          ok: true,
          state: {
            ...touched,
            nowPlaying: item,
            playback: { status: 'playing', positionSec: 0, updatedAt: deps.now },
          },
        };
      }
      return { ok: true, state: { ...touched, queue: [...state.queue, item] } };
    }

    case 'remove': {
      const item = state.queue.find((i) => i.id === action.itemId);
      if (!item) return fail('not_found', 'That video isn’t in the queue anymore.');
      if (!actor.isHost && item.addedBy !== actor.clientId) {
        return fail('forbidden', 'You can only remove your own videos.');
      }
      return {
        ok: true,
        state: { ...touched, queue: state.queue.filter((i) => i.id !== action.itemId) },
      };
    }

    case 'reorder': {
      if (!actor.isHost) return fail('forbidden', 'Only the host can reorder the queue.');
      const from = state.queue.findIndex((i) => i.id === action.itemId);
      const item = state.queue[from];
      if (!item) return fail('not_found', 'That video isn’t in the queue anymore.');
      const queue = state.queue.filter((i) => i.id !== action.itemId);
      queue.splice(Math.min(action.toIndex, queue.length), 0, item);
      return { ok: true, state: { ...touched, queue } };
    }

    case 'control': {
      if (!canControlPlayback(state, actor)) {
        return fail('forbidden', 'Only the host can control playback.');
      }
      if (action.action === 'skip') {
        if (!state.nowPlaying) return fail('not_found', 'Nothing is playing.');
        return { ok: true, state: advance(touched, deps.now) };
      }
      const status = action.action === 'play' ? 'playing' : 'paused';
      return {
        ok: true,
        state: { ...touched, playback: { ...state.playback, status, updatedAt: deps.now } },
      };
    }

    case 'settings': {
      if (!actor.isHost) return fail('forbidden', 'Only the host can change settings.');
      return {
        ok: true,
        state: { ...touched, settings: { ...state.settings, ...action.settings } },
      };
    }

    case 'tv:ended':
    case 'tv:error': {
      if (actor.role !== 'tv') return fail('forbidden', 'Only the TV can report playback.');
      // Ignore stale reports (e.g. two TVs open) so one ending can't skip two videos.
      if (state.nowPlaying?.id !== action.itemId) return { ok: true, state };
      return { ok: true, state: advance(touched, deps.now) };
    }

    case 'tv:progress': {
      if (actor.role !== 'tv') return fail('forbidden', 'Only the TV can report playback.');
      return {
        ok: true,
        state: {
          ...state,
          playback: { ...state.playback, positionSec: action.positionSec, updatedAt: deps.now },
        },
      };
    }

    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

/** Strips secrets and adds live info, producing what clients receive. */
export function toSnapshot(
  state: RoomState,
  onlineClientIds: ReadonlySet<string>,
  isTvConnected: boolean,
): RoomSnapshot {
  return {
    code: state.code,
    settings: state.settings,
    nowPlaying: state.nowPlaying,
    queue: state.queue,
    members: state.members.map((m) => ({ ...m, isOnline: onlineClientIds.has(m.clientId) })),
    playback: state.playback,
    isTvConnected,
  };
}

import { describe, expect, it } from 'vitest';
import type { Video } from '../shared/types';
import {
  type Actor,
  applyAction,
  createRoomState,
  type RoomAction,
  type RoomState,
  toSnapshot,
} from './roomLogic';

const host: Actor = { clientId: 'host-1234', role: 'phone', isHost: true };
const ana: Actor = { clientId: 'ana-12345', role: 'phone', isHost: false };
const leo: Actor = { clientId: 'leo-12345', role: 'phone', isHost: false };
const tv: Actor = { clientId: 'tv-123456', role: 'tv', isHost: false };

function video(n: number): Video {
  return {
    videoId: `vid${String(n).padStart(8, '0')}`,
    title: `Video ${n}`,
    channel: 'Channel',
    durationSec: 60,
    thumbnailUrl: '',
  };
}

function makeDeps() {
  let id = 0;
  return { now: 1000, newId: () => `item-${++id}` };
}

/** Applies actions in order and fails the test if any is rejected. */
function run(state: RoomState, steps: [RoomAction, Actor][]): RoomState {
  const deps = makeDeps();
  return steps.reduce((s, [action, actor]) => {
    const result = applyAction(s, action, actor, deps);
    if (!result.ok) throw new Error(`${action.type} rejected: ${result.message}`);
    return result.state;
  }, state);
}

function roomWithMembers(): RoomState {
  return run(createRoomState('KWZP', { hostToken: 'h', tvToken: 't' }, 0), [
    [{ type: 'join', name: 'Host' }, host],
    [{ type: 'join', name: 'Ana' }, ana],
    [{ type: 'join', name: 'Leo' }, leo],
  ]);
}

function expectError(state: RoomState, action: RoomAction, actor: Actor, code: string) {
  const result = applyAction(state, action, actor, makeDeps());
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe(code);
}

describe('join', () => {
  it('adds members with friend colors in order', () => {
    const state = roomWithMembers();
    expect(state.members.map((m) => [m.name, m.color, m.isHost])).toEqual([
      ['Host', 'coral', true],
      ['Ana', 'mint', false],
      ['Leo', 'pink', false],
    ]);
  });

  it('updates the name of a returning member without a new color', () => {
    const state = run(roomWithMembers(), [[{ type: 'join', name: 'Ana B' }, ana]]);
    expect(state.members).toHaveLength(3);
    expect(state.members[1]).toMatchObject({ name: 'Ana B', color: 'mint' });
  });

  it('requires joining before other actions', () => {
    const state = createRoomState('KWZP', { hostToken: 'h', tvToken: 't' }, 0);
    expectError(state, { type: 'add', video: video(1) }, ana, 'not_joined');
  });
});

describe('add', () => {
  it('plays the first video right away and queues the rest in order', () => {
    const state = run(roomWithMembers(), [
      [{ type: 'add', video: video(1) }, ana],
      [{ type: 'add', video: video(2) }, leo],
      [{ type: 'add', video: video(3) }, ana],
    ]);
    expect(state.nowPlaying).toMatchObject({ title: 'Video 1', addedByName: 'Ana', color: 'mint' });
    expect(state.queue.map((i) => i.title)).toEqual(['Video 2', 'Video 3']);
  });

  it('blocks a guest at the per-person limit, counting only waiting videos', () => {
    let state = run(roomWithMembers(), [
      [{ type: 'settings', settings: { perPersonLimit: 2 } }, host],
      [{ type: 'add', video: video(1) }, ana], // playing, doesn't count
      [{ type: 'add', video: video(2) }, ana],
      [{ type: 'add', video: video(3) }, ana],
    ]);
    expectError(state, { type: 'add', video: video(4) }, ana, 'limit_reached');
    // Other guests are unaffected.
    state = run(state, [[{ type: 'add', video: video(5) }, leo]]);
    expect(state.queue).toHaveLength(3);
  });

  it('exempts the host from the limit', () => {
    const state = run(roomWithMembers(), [
      [{ type: 'settings', settings: { perPersonLimit: 1 } }, host],
      [{ type: 'add', video: video(1) }, host],
      [{ type: 'add', video: video(2) }, host],
      [{ type: 'add', video: video(3) }, host],
    ]);
    expect(state.queue).toHaveLength(2);
  });

  it('does not let the TV add videos', () => {
    expectError(roomWithMembers(), { type: 'add', video: video(1) }, tv, 'forbidden');
  });
});

describe('remove', () => {
  const withQueue = () =>
    run(roomWithMembers(), [
      [{ type: 'add', video: video(1) }, ana],
      [{ type: 'add', video: video(2) }, ana],
      [{ type: 'add', video: video(3) }, leo],
    ]);

  it('lets a guest remove their own video', () => {
    const state = run(withQueue(), [[{ type: 'remove', itemId: 'item-2' }, ana]]);
    expect(state.queue.map((i) => i.title)).toEqual(['Video 3']);
  });

  it('stops a guest removing someone else’s video', () => {
    expectError(withQueue(), { type: 'remove', itemId: 'item-3' }, ana, 'forbidden');
  });

  it('lets the host remove any video', () => {
    const state = run(withQueue(), [[{ type: 'remove', itemId: 'item-3' }, host]]);
    expect(state.queue.map((i) => i.title)).toEqual(['Video 2']);
  });

  it('reports a missing video', () => {
    expectError(withQueue(), { type: 'remove', itemId: 'nope' }, host, 'not_found');
  });
});

describe('reorder', () => {
  const withQueue = () =>
    run(roomWithMembers(), [
      [{ type: 'add', video: video(1) }, ana],
      [{ type: 'add', video: video(2) }, ana],
      [{ type: 'add', video: video(3) }, leo],
      [{ type: 'add', video: video(4) }, leo],
    ]);

  it('lets the host move a video to the top', () => {
    const state = run(withQueue(), [[{ type: 'reorder', itemId: 'item-4', toIndex: 0 }, host]]);
    expect(state.queue.map((i) => i.title)).toEqual(['Video 4', 'Video 2', 'Video 3']);
  });

  it('clamps an index past the end', () => {
    const state = run(withQueue(), [[{ type: 'reorder', itemId: 'item-2', toIndex: 99 }, host]]);
    expect(state.queue.map((i) => i.title)).toEqual(['Video 3', 'Video 4', 'Video 2']);
  });

  it('keeps new videos going to the end after a reorder', () => {
    const state = run(withQueue(), [
      [{ type: 'reorder', itemId: 'item-4', toIndex: 0 }, host],
      [{ type: 'add', video: video(5) }, ana],
    ]);
    expect(state.queue.at(-1)?.title).toBe('Video 5');
  });

  it('is host only', () => {
    expectError(withQueue(), { type: 'reorder', itemId: 'item-4', toIndex: 0 }, ana, 'forbidden');
  });
});

describe('playback control', () => {
  const playing = () =>
    run(roomWithMembers(), [
      [{ type: 'add', video: video(1) }, ana],
      [{ type: 'add', video: video(2) }, leo],
    ]);

  it('lets the host skip to the next video', () => {
    const state = run(playing(), [[{ type: 'control', action: 'skip' }, host]]);
    expect(state.nowPlaying?.title).toBe('Video 2');
    expect(state.queue).toHaveLength(0);
  });

  it('blocks guests unless guest controls are on', () => {
    expectError(playing(), { type: 'control', action: 'pause' }, ana, 'forbidden');
    const state = run(playing(), [
      [{ type: 'settings', settings: { guestControls: true } }, host],
      [{ type: 'control', action: 'pause' }, ana],
    ]);
    expect(state.playback.status).toBe('paused');
  });

  it('clears now playing when skipping the last video', () => {
    const state = run(playing(), [
      [{ type: 'control', action: 'skip' }, host],
      [{ type: 'control', action: 'skip' }, host],
    ]);
    expect(state.nowPlaying).toBeNull();
  });
});

describe('settings', () => {
  it('is host only and merges partial changes', () => {
    expectError(
      roomWithMembers(),
      { type: 'settings', settings: { guestControls: true } },
      ana,
      'forbidden',
    );
    const state = run(roomWithMembers(), [
      [{ type: 'settings', settings: { perPersonLimit: 3 } }, host],
      [{ type: 'settings', settings: { guestControls: true } }, host],
    ]);
    expect(state.settings).toEqual({ guestControls: true, perPersonLimit: 3 });
  });
});

describe('TV events', () => {
  const playing = () =>
    run(roomWithMembers(), [
      [{ type: 'add', video: video(1) }, ana],
      [{ type: 'add', video: video(2) }, leo],
    ]);

  it('advances when the current video ends or fails', () => {
    const ended = run(playing(), [[{ type: 'tv:ended', itemId: 'item-1' }, tv]]);
    expect(ended.nowPlaying?.title).toBe('Video 2');
    const failed = run(playing(), [[{ type: 'tv:error', itemId: 'item-1' }, tv]]);
    expect(failed.nowPlaying?.title).toBe('Video 2');
  });

  it('ignores a stale ended event so it can’t skip twice', () => {
    const state = run(playing(), [
      [{ type: 'tv:ended', itemId: 'item-1' }, tv],
      [{ type: 'tv:ended', itemId: 'item-1' }, tv],
    ]);
    expect(state.nowPlaying?.title).toBe('Video 2');
  });

  it('only accepts playback reports from the TV', () => {
    expectError(playing(), { type: 'tv:ended', itemId: 'item-1' }, host, 'forbidden');
    expectError(playing(), { type: 'tv:progress', positionSec: 5 }, ana, 'forbidden');
  });

  it('records progress so a reloaded TV can resume', () => {
    const state = run(playing(), [[{ type: 'tv:progress', positionSec: 42 }, tv]]);
    expect(state.playback.positionSec).toBe(42);
  });
});

describe('toSnapshot', () => {
  it('leaves out tokens and marks who is online', () => {
    const snapshot = toSnapshot(roomWithMembers(), new Set([ana.clientId]), true);
    expect(JSON.stringify(snapshot)).not.toMatch(/hostToken|tvToken/);
    expect(snapshot.members.map((m) => m.isOnline)).toEqual([false, true, false]);
    expect(snapshot.isTvConnected).toBe(true);
  });
});

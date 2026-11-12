import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';
import { ROOM_TTL_MS } from '../shared/constants';
import { clientMessageSchema } from '../shared/schemas';
import type { ClientMessage, ErrorCode, ServerMessage } from '../shared/types';
import { generateToken } from './codes';
import {
  type Actor,
  applyAction,
  createRoomState,
  type RoomAction,
  type RoomState,
  toSnapshot,
} from './roomLogic';
import { fetchVideo } from './youtube';

const STATE_KEY = 'room';

/** Saved on each socket so it survives the Durable Object hibernating between messages. */
const socketInfoSchema = z.object({
  actor: z
    .object({ clientId: z.string(), role: z.enum(['phone', 'tv']), isHost: z.boolean() })
    .nullable(),
});
type SocketInfo = { actor: Actor | null };

/**
 * One instance per room code. Holds the room state, every open WebSocket for that room, and
 * broadcasts a fresh snapshot after each change. Rule decisions live in `roomLogic.ts`.
 */
export class Room extends DurableObject<Env> {
  /** Creates the room if this code is free. Returns null when the code is already taken. */
  async init(code: string): Promise<{ hostToken: string; tvToken: string } | null> {
    if (await this.ctx.storage.get<RoomState>(STATE_KEY)) return null;
    const tokens = { hostToken: generateToken(), tvToken: generateToken() };
    await this.save(createRoomState(code, tokens, Date.now()));
    return tokens;
  }

  async exists(): Promise<boolean> {
    return (await this.ctx.storage.get<RoomState>(STATE_KEY)) !== undefined;
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    // Hibernation API: the runtime can evict this object while sockets stay open.
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ actor: null } satisfies SocketInfo);
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string') return this.sendError(ws, 'bad_message', 'Expected text.');

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return this.sendError(ws, 'bad_message', 'Message was not JSON.');
    }
    const parsed = clientMessageSchema.safeParse(json);
    if (!parsed.success) return this.sendError(ws, 'bad_message', 'Message had the wrong shape.');

    const state = await this.ctx.storage.get<RoomState>(STATE_KEY);
    if (!state) {
      this.sendError(ws, 'room_gone', 'This room has ended.');
      ws.close(4404, 'room_gone');
      return;
    }

    const message = parsed.data;
    const info = this.socketInfo(ws);

    if (message.type === 'hello') {
      const actor: Actor = {
        clientId: message.clientId,
        role: message.role === 'tv' && message.tvToken === state.tvToken ? 'tv' : 'phone',
        isHost: message.hostToken === state.hostToken,
      };
      if (message.role === 'tv' && actor.role !== 'tv') {
        return this.sendError(ws, 'forbidden', 'This TV link is not valid for the room.');
      }
      ws.serializeAttachment({ actor } satisfies SocketInfo);
      if (actor.role === 'tv') return this.broadcast(state);
      return this.apply(ws, state, { type: 'join', name: message.name }, actor);
    }

    if (!info.actor) return this.sendError(ws, 'not_joined', 'Say hello first.');

    const action = await this.toAction(message);
    if ('error' in action) return this.sendError(ws, action.error, action.message);
    return this.apply(ws, state, action, info.actor);
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    ws.close();
    // Online status and TV presence come from open sockets, so tell everyone who left.
    const state = await this.ctx.storage.get<RoomState>(STATE_KEY);
    if (state) this.broadcast(state, ws);
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  /** Deletes the room once it has been idle for `ROOM_TTL_MS` (requirement R1.4). */
  override async alarm(): Promise<void> {
    const state = await this.ctx.storage.get<RoomState>(STATE_KEY);
    if (state && Date.now() - state.lastActivity < ROOM_TTL_MS) {
      await this.ctx.storage.setAlarm(state.lastActivity + ROOM_TTL_MS);
      return;
    }
    for (const ws of this.ctx.getWebSockets()) ws.close(4404, 'room_gone');
    await this.ctx.storage.deleteAll();
  }

  // ---- helpers ----

  /** Turns a validated message into a room action, looking up video details for `add`. */
  private async toAction(
    message: Exclude<ClientMessage, { type: 'hello' }>,
  ): Promise<RoomAction | { error: ErrorCode; message: string }> {
    if (message.type !== 'add') return message;
    const lookup = await fetchVideo(message.videoId, this.env.YOUTUBE_API_KEY);
    if (lookup.ok) return { type: 'add', video: lookup.video };
    const messages = {
      not_found: 'That video doesn’t exist or is private.',
      not_embeddable: 'That video can’t be played outside YouTube.',
      api_error: 'Couldn’t reach YouTube. Try again in a moment.',
    } as const;
    return { error: 'video_unavailable', message: messages[lookup.reason] };
  }

  private async apply(ws: WebSocket, state: RoomState, action: RoomAction, actor: Actor) {
    const result = applyAction(state, action, actor, {
      now: Date.now(),
      newId: () => crypto.randomUUID(),
    });
    if (!result.ok) return this.sendError(ws, result.code, result.message);
    await this.save(result.state);
    this.broadcast(result.state);
  }

  private async save(state: RoomState) {
    await this.ctx.storage.put(STATE_KEY, state);
    await this.ctx.storage.setAlarm(state.lastActivity + ROOM_TTL_MS);
  }

  private socketInfo(ws: WebSocket): SocketInfo {
    const parsed = socketInfoSchema.safeParse(ws.deserializeAttachment());
    return parsed.success ? parsed.data : { actor: null };
  }

  /** Sends each joined socket the latest snapshot. `closing` is excluded from online status. */
  private broadcast(state: RoomState, closing?: WebSocket) {
    const sockets = this.ctx.getWebSockets().filter((ws) => ws !== closing);
    const actors = sockets
      .map((ws) => this.socketInfo(ws).actor)
      .filter((a): a is Actor => a !== null);
    const online = new Set(actors.filter((a) => a.role === 'phone').map((a) => a.clientId));
    const isTvConnected = actors.some((a) => a.role === 'tv');
    const room = toSnapshot(state, online, isTvConnected);

    for (const ws of sockets) {
      const actor = this.socketInfo(ws).actor;
      if (!actor) continue;
      this.send(ws, {
        type: 'state',
        room,
        you: { clientId: actor.clientId, isHost: actor.isHost },
      });
    }
  }

  private send(ws: WebSocket, message: ServerMessage) {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // The socket closed mid-send; webSocketClose will clean up.
    }
  }

  private sendError(ws: WebSocket, code: ErrorCode, message: string) {
    this.send(ws, { type: 'error', code, message });
  }
}

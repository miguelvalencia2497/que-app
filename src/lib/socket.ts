import { serverMessageSchema } from '../../shared/schemas';
import type { ClientMessage } from '../../shared/types';
import { useRoomStore } from '../store/roomStore';

type Hello = Extract<ClientMessage, { type: 'hello' }>;

let socket: WebSocket | null = null;

/**
 * Opens the room's live connection, says hello, and keeps the store in sync. Reconnects with
 * backoff when the connection drops (phones sleep, Wi-Fi blips). Returns a function that
 * disconnects for good.
 */
export function connectToRoom(code: string, hello: Hello): () => void {
  const store = useRoomStore.getState();
  store.reset();
  let stopped = false;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/api/rooms/${code}/ws`);
    socket = ws;

    ws.addEventListener('open', () => {
      attempt = 0;
      ws.send(JSON.stringify(hello));
      useRoomStore.getState().setStatus('open');
    });

    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      let json: unknown;
      try {
        json = JSON.parse(event.data);
      } catch {
        return;
      }
      const parsed = serverMessageSchema.safeParse(json);
      if (!parsed.success) return;
      const message = parsed.data;
      if (message.type === 'state') {
        useRoomStore.getState().setSnapshot(message.room, message.you);
      } else {
        useRoomStore.getState().setError(message.code, message.message);
      }
    });

    ws.addEventListener('close', (event) => {
      if (socket === ws) socket = null;
      if (stopped) return;
      // 4404 = the room expired or never existed; retrying won't help.
      if (event.code === 4404) {
        useRoomStore.getState().setStatus('gone');
        return;
      }
      useRoomStore.getState().setStatus('reconnecting');
      const delay = Math.min(1000 * 2 ** attempt, 10_000);
      attempt += 1;
      retryTimer = setTimeout(open, delay);
    });
  };

  open();

  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    socket?.close();
    socket = null;
  };
}

/** Sends an action to the room. Dropped silently if the connection is down (UI shows status). */
export function sendAction(message: Exclude<ClientMessage, { type: 'hello' }>): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

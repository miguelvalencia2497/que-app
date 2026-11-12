import { create } from 'zustand';
import type { ErrorCode, RoomSnapshot } from '../../shared/types';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'gone';

type RoomError = { code: ErrorCode; message: string; at: number };

type RoomStore = {
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  you: { clientId: string; isHost: boolean } | null;
  error: RoomError | null;
  setStatus: (status: ConnectionStatus) => void;
  setSnapshot: (room: RoomSnapshot, you: { clientId: string; isHost: boolean }) => void;
  setError: (code: ErrorCode, message: string) => void;
  clearError: () => void;
  reset: () => void;
};

const initial = { status: 'connecting' as const, room: null, you: null, error: null };

/**
 * Mirror of the server's room state. Only `lib/socket.ts` writes to it (plus `clearError` from
 * the UI when a message is dismissed); components read slices with selectors.
 */
export const useRoomStore = create<RoomStore>()((set) => ({
  ...initial,
  setStatus: (status) => set({ status }),
  setSnapshot: (room, you) => set({ room, you }),
  setError: (code, message) => set({ error: { code, message, at: Date.now() } }),
  clearError: () => set({ error: null }),
  reset: () => set(initial),
}));

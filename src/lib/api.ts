import { createRoomResponseSchema } from '../../shared/schemas';
import type { CreateRoomResponse } from '../../shared/types';

export async function createRoom(): Promise<CreateRoomResponse> {
  const res = await fetch('/api/rooms', { method: 'POST' });
  if (!res.ok) throw new Error('Couldn’t create a room. Try again.');
  return createRoomResponseSchema.parse(await res.json());
}

export async function roomExists(code: string): Promise<boolean> {
  const res = await fetch(`/api/rooms/${code}`);
  return res.ok;
}

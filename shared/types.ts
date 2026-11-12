import type { z } from 'zod';
import type {
  clientMessageSchema,
  createRoomResponseSchema,
  errorCodeSchema,
  friendColorSchema,
  memberSchema,
  playbackSchema,
  queueItemSchema,
  roomSnapshotSchema,
  serverMessageSchema,
  settingsSchema,
  videoSchema,
} from './schemas';

export type FriendColor = z.infer<typeof friendColorSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Video = z.infer<typeof videoSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Playback = z.infer<typeof playbackSchema>;
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;

import { z } from 'zod';
import {
  FRIEND_COLORS,
  MAX_NAME_LENGTH,
  MAX_PER_PERSON_LIMIT,
  ROOM_CODE_LENGTH,
} from './constants';

/** A 4-letter room code from `ROOM_CODE_ALPHABET` (A–Z without I, L, O). */
export const roomCodeSchema = z
  .string()
  .regex(new RegExp(`^[A-HJKMNP-Z]{${ROOM_CODE_LENGTH}}$`), 'Invalid room code');

/** Random id a device generates once and keeps in localStorage. */
export const clientIdSchema = z.string().min(8).max(64);

export const displayNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

export const friendColorSchema = z.enum(FRIEND_COLORS);

/** An 11-character YouTube video id. */
export const videoIdSchema = z.string().regex(/^[\w-]{11}$/, 'Invalid video id');

/** Host-controlled room settings (requirements R5.1, R5.2). */
export const settingsSchema = z.object({
  /** When true, guests can also play, pause and skip. */
  guestControls: z.boolean(),
  /** Max unplayed videos one guest can have queued; `null` = no limit. Host is exempt. */
  perPersonLimit: z.number().int().min(1).max(MAX_PER_PERSON_LIMIT).nullable(),
});

/** Video details looked up from the YouTube Data API. */
export const videoSchema = z.object({
  videoId: videoIdSchema,
  title: z.string(),
  channel: z.string(),
  durationSec: z.number().int().nonnegative(),
  thumbnailUrl: z.string(),
});

/** A video in the queue, plus who added it. */
export const queueItemSchema = videoSchema.extend({
  id: z.string(),
  addedBy: clientIdSchema,
  addedByName: displayNameSchema,
  color: friendColorSchema,
  addedAt: z.number(),
});

export const memberSchema = z.object({
  clientId: clientIdSchema,
  name: displayNameSchema,
  color: friendColorSchema,
  isHost: z.boolean(),
  isOnline: z.boolean(),
});

export const playbackSchema = z.object({
  status: z.enum(['playing', 'paused']),
  /** Position of the current video when `updatedAt` was recorded, so a reloaded TV can resume. */
  positionSec: z.number().nonnegative(),
  updatedAt: z.number(),
});

/** Everything a phone or TV needs to render the room. Never contains tokens. */
export const roomSnapshotSchema = z.object({
  code: roomCodeSchema,
  settings: settingsSchema,
  nowPlaying: queueItemSchema.nullable(),
  queue: z.array(queueItemSchema),
  members: z.array(memberSchema),
  playback: playbackSchema,
  isTvConnected: z.boolean(),
});

// ---- Client → room messages ----

/** Messages a phone or TV sends over the room WebSocket. */
export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    clientId: clientIdSchema,
    name: displayNameSchema,
    role: z.enum(['phone', 'tv']),
    hostToken: z.string().optional(),
    tvToken: z.string().optional(),
  }),
  z.object({ type: z.literal('add'), videoId: videoIdSchema }),
  z.object({ type: z.literal('remove'), itemId: z.string() }),
  z.object({ type: z.literal('reorder'), itemId: z.string(), toIndex: z.number().int().min(0) }),
  z.object({ type: z.literal('control'), action: z.enum(['play', 'pause', 'skip']) }),
  z.object({ type: z.literal('settings'), settings: settingsSchema.partial() }),
  z.object({ type: z.literal('tv:ended'), itemId: z.string() }),
  z.object({ type: z.literal('tv:error'), itemId: z.string() }),
  z.object({ type: z.literal('tv:progress'), positionSec: z.number().nonnegative() }),
]);

// ---- Room → client messages ----

export const errorCodeSchema = z.enum([
  'bad_message',
  'not_joined',
  'forbidden',
  'limit_reached',
  'not_found',
  'video_unavailable',
  'room_gone',
]);

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('state'),
    room: roomSnapshotSchema,
    you: z.object({ clientId: clientIdSchema, isHost: z.boolean() }),
  }),
  z.object({ type: z.literal('error'), code: errorCodeSchema, message: z.string() }),
]);

// ---- HTTP API ----

export const createRoomResponseSchema = z.object({
  code: roomCodeSchema,
  hostToken: z.string(),
  tvToken: z.string(),
});

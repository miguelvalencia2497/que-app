/** Letters used for room codes. I, L and O are left out so codes can't be misread as 1 or 0. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

export const MAX_NAME_LENGTH = 24;

/** Highest per-person queue limit the host can pick; `null` means no limit. */
export const MAX_PER_PERSON_LIMIT = 10;

/** A room is deleted after this long with no activity. */
export const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Friend colors handed out to members in join order. The names match Tailwind theme tokens
 * (`bg-friend-coral`, etc.) defined in `src/styles.css`.
 */
export const FRIEND_COLORS = ['coral', 'mint', 'pink', 'sunny', 'sky', 'grape'] as const;

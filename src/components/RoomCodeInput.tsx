import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '../../shared/constants';

type RoomCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Keeps only letters that can appear in a room code, upper-cased, up to the code length. */
export function sanitizeRoomCode(raw: string): string {
  return [...raw.toUpperCase()]
    .filter((ch) => ROOM_CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, ROOM_CODE_LENGTH);
}

/**
 * One real text input drawn as letter tiles. A single input (rather than four) keeps paste,
 * autofill and screen readers working.
 */
export function RoomCodeInput({ value, onChange }: RoomCodeInputProps) {
  const tiles = Array.from({ length: ROOM_CODE_LENGTH }, (_, i) => value[i] ?? '');
  return (
    <div className="relative">
      <div className="flex gap-2" aria-hidden="true">
        {tiles.map((ch, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: tiles are fixed positions
            key={i}
            className={`flex h-15 flex-1 items-center justify-center rounded-tile text-code font-extrabold ${
              i === value.length ? 'border-3 border-grape bg-white' : 'bg-lilac-deep'
            }`}
          >
            {ch}
          </span>
        ))}
      </div>
      <input
        id="room-code"
        aria-label="Room code"
        value={value}
        onChange={(e) => onChange(sanitizeRoomCode(e.target.value))}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        maxLength={ROOM_CODE_LENGTH + 4}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}

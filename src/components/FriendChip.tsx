import type { FriendColor } from '../../shared/types';

// Full class names written out so Tailwind can find them.
export const FRIEND_CLASSES: Record<FriendColor, { fill: string; text: string }> = {
  coral: { fill: 'bg-friend-coral', text: 'text-friend-coral-ink' },
  mint: { fill: 'bg-friend-mint', text: 'text-friend-mint-ink' },
  pink: { fill: 'bg-friend-pink', text: 'text-friend-pink-ink' },
  sunny: { fill: 'bg-friend-sunny', text: 'text-friend-sunny-ink' },
  sky: { fill: 'bg-friend-sky', text: 'text-friend-sky-ink' },
  grape: { fill: 'bg-friend-grape', text: 'text-friend-grape-ink' },
};

type FriendChipProps = {
  name: string;
  color: FriendColor;
};

/** Name pill with the person's friend color, used for "added by". */
export function FriendChip({ name, color }: FriendChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white py-0.5 pr-3 pl-1 text-sm font-bold ${FRIEND_CLASSES[color].text}`}
    >
      <span className={`size-5.5 rounded-full ${FRIEND_CLASSES[color].fill}`} />
      {name}
    </span>
  );
}

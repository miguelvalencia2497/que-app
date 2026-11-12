import type { QueueItem } from '../../shared/types';
import { FRIEND_CLASSES } from './FriendChip';
import { CloseIcon } from './icons/Icons';

type QueueRowProps = {
  item: QueueItem;
  isMine: boolean;
  canRemove: boolean;
  onRemove: (itemId: string) => void;
};

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = String(totalSec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** One upcoming video: thumbnail, title, who added it and how long it is. */
export function QueueRow({ item, isMine, canRemove, onRemove }: QueueRowProps) {
  const color = FRIEND_CLASSES[item.color];
  return (
    <li
      className={`flex items-center gap-2.5 rounded-full py-1.5 pr-2 pl-1.5 ${isMine ? 'bg-blush' : 'bg-white'}`}
    >
      <img
        src={item.thumbnailUrl}
        alt=""
        className={`size-12 shrink-0 rounded-full object-cover ${color.fill}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base leading-tight font-bold">{item.title}</span>
        <span className={`text-sm font-bold ${color.text}`}>
          {isMine ? 'You' : item.addedByName} · {formatDuration(item.durationSec)}
        </span>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.title}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-sm text-danger-ink"
        >
          <CloseIcon />
        </button>
      )}
    </li>
  );
}

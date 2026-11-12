import type { Playback, QueueItem } from '../../shared/types';
import { FriendChip } from './FriendChip';
import { PauseIcon, PlayIcon, SkipIcon } from './icons/Icons';
import { Mascot } from './Mascot';

type NowPlayingCardProps = {
  item: QueueItem | null;
  playback: Playback;
  canControl: boolean;
  onControl: (action: 'play' | 'pause' | 'skip') => void;
};

const controlButton =
  'flex size-11.5 items-center justify-center rounded-full bg-white text-lg text-grape-deep';

export function NowPlayingCard({ item, playback, canControl, onControl }: NowPlayingCardProps) {
  if (!item) {
    return (
      <section className="flex items-center gap-4 rounded-blob bg-white p-5">
        <Mascot />
        <p className="text-lg leading-snug font-bold">
          The queue’s empty. Be the first to add something.
        </p>
      </section>
    );
  }

  const isPaused = playback.status === 'paused';
  return (
    <section
      aria-label="Now playing"
      className="flex flex-col gap-2 rounded-blob bg-grape p-3.5 text-white"
    >
      <div className="relative overflow-hidden rounded-3xl bg-grape-deep">
        <img src={item.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-sunny-soft px-3 text-sm font-extrabold text-sunny-ink">
          {isPaused ? 'Paused' : 'Now playing'}
        </span>
      </div>
      <p className="text-button leading-tight font-bold">{item.title}</p>
      <div className="flex items-center justify-between">
        <FriendChip name={item.addedByName} color={item.color} />
        {canControl && (
          <div className="flex gap-2">
            <button
              type="button"
              className={controlButton}
              aria-label={isPaused ? 'Play' : 'Pause'}
              onClick={() => onControl(isPaused ? 'play' : 'pause')}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <button
              type="button"
              className={controlButton}
              aria-label="Skip"
              onClick={() => onControl('skip')}
            >
              <SkipIcon />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

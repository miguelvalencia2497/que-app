import { useState } from 'react';
import { ShareIcon } from './icons/Icons';
import { Mascot } from './Mascot';

type RoomHeaderProps = {
  code: string;
};

export function RoomHeader({ code }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${location.origin}/r/${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join my Hangout Queue', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share sheet dismissed or clipboard blocked; nothing to do.
    }
  };

  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-2">
      <div className="flex items-center gap-2.5">
        <Mascot />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-medium text-ink-soft">Room</span>
          <span className="text-3xl font-extrabold tracking-widest">{code}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? 'Link copied' : 'Share room link'}
        className="flex size-11.5 items-center justify-center rounded-full bg-white text-xl text-grape-deep"
      >
        <ShareIcon />
      </button>
    </header>
  );
}

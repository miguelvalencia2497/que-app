import { useEffect } from 'react';
import { useRoomStore } from '../store/roomStore';
import { Mascot } from './Mascot';

const DISMISS_AFTER_MS = 4000;

/** Shows the latest error from the room (e.g. the per-person limit) and hides it after a bit. */
export function ErrorToast() {
  const error = useRoomStore((s) => s.error);
  const clearError = useRoomStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-blob-alt bg-danger-soft py-2.5 pr-4 pl-2.5 font-bold text-danger-ink"
    >
      <Mascot mood="worried" />
      <span>{error.message}</span>
    </div>
  );
}

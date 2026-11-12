import { type FormEvent, useState } from 'react';
import { parseYoutubeUrl } from '../../shared/parseYoutubeUrl';
import { Button } from './Button';
import { PlusIcon } from './icons/Icons';

type AddVideoFormProps = {
  onAdd: (videoId: string) => void;
};

/**
 * Paste-a-link form pinned to the bottom of the room. Search and the bottom sheet from the
 * design come in a later step; for now anything that isn't a YouTube link gets a hint.
 */
export function AddVideoForm({ onAdd }: AddVideoFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Paste a YouTube link first.');
      return;
    }
    const videoId = parseYoutubeUrl(text);
    if (!videoId) {
      setError('That isn’t a YouTube video link. Search is coming soon.');
      return;
    }
    onAdd(videoId);
    setText('');
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor="video-link" className="sr-only">
        YouTube link
      </label>
      <input
        id="video-link"
        type="url"
        inputMode="url"
        placeholder="Paste a YouTube link"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        aria-invalid={error !== null}
        aria-describedby={error ? 'video-link-error' : undefined}
        className="h-14 rounded-full border-3 border-grape bg-white px-5 text-lg font-medium placeholder:text-ink-soft"
      />
      {error && (
        <p id="video-link-error" role="alert" className="px-3 text-sm font-bold text-danger-ink">
          {error}
        </p>
      )}
      <Button type="submit" icon={<PlusIcon className="text-lg" />}>
        Add a video
      </Button>
    </form>
  );
}

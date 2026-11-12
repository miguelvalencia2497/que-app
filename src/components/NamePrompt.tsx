import { type FormEvent, useState } from 'react';
import { MAX_NAME_LENGTH } from '../../shared/constants';
import { Button } from './Button';
import { Mascot } from './Mascot';

type NamePromptProps = {
  roomCode: string;
  onSubmit: (name: string) => void;
};

/** Shown once per device before joining (requirement R1.3). */
export function NamePrompt({ roomCode, onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name so friends know who added what.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot size="lg" />
        <h1 className="mt-4 text-3xl font-extrabold">What should we call you?</h1>
        <p className="font-medium text-ink-soft">You’re joining room {roomCode}.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <label htmlFor="display-name" className="sr-only">
          Your name
        </label>
        <input
          id="display-name"
          // biome-ignore lint/a11y/noAutofocus: the only thing to do on this screen
          autoFocus
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Your name"
          aria-invalid={error !== null}
          aria-describedby={error ? 'name-error' : undefined}
          className="h-14 rounded-full border-3 border-grape bg-white px-5 text-lg font-bold placeholder:font-medium placeholder:text-ink-soft"
        />
        {error && (
          <p id="name-error" role="alert" className="px-3 text-sm font-bold text-danger-ink">
            {error}
          </p>
        )}
        <Button type="submit">Join the room</Button>
      </form>
    </main>
  );
}

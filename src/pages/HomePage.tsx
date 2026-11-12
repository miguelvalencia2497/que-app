import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROOM_CODE_LENGTH } from '../../shared/constants';
import { Button } from '../components/Button';
import { PlusIcon } from '../components/icons/Icons';
import { Mascot } from '../components/Mascot';
import { RoomCodeInput } from '../components/RoomCodeInput';
import { createRoom, roomExists } from '../lib/api';
import { setHostToken, setTvToken } from '../lib/storage';

export function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length < ROOM_CODE_LENGTH) {
      setError(`Enter all ${ROOM_CODE_LENGTH} letters of the code.`);
      return;
    }
    setIsBusy(true);
    try {
      if (await roomExists(code)) navigate(`/r/${code}`);
      else setError('There’s no room with that code. Check the TV and try again.');
    } catch {
      setError('Couldn’t reach the server. Check your connection.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreate = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const room = await createRoom();
      setHostToken(room.code, room.hostToken);
      setTvToken(room.code, room.tvToken);
      navigate(`/r/${room.code}`);
    } catch {
      setError('Couldn’t create a room. Try again.');
      setIsBusy(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col gap-6 overflow-hidden px-6 pt-12 pb-8">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="mt-6">
          <Mascot size="lg" />
        </div>
        <h1 className="mt-4 text-hero font-extrabold">Hangout Queue</h1>
        <p className="text-lg font-medium text-ink-soft">
          Everyone adds videos. The TV plays them in order.
        </p>
      </div>

      <form
        onSubmit={handleJoin}
        className="flex flex-col gap-3 rounded-blob bg-white p-5"
        noValidate
      >
        <label htmlFor="room-code" className="text-xl font-extrabold">
          Join a room
        </label>
        <RoomCodeInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
        />
        <Button type="submit" variant="secondary" disabled={isBusy}>
          Join
        </Button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-blob-alt bg-danger-soft px-4 py-3 font-bold text-danger-ink"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 font-bold text-ink-soft">
        <span className="h-0.75 flex-1 rounded-full bg-lilac-line" />
        or
        <span className="h-0.75 flex-1 rounded-full bg-lilac-line" />
      </div>

      <Button onClick={handleCreate} disabled={isBusy} icon={<PlusIcon className="text-lg" />}>
        Create a room
      </Button>
      <p className="text-center font-medium text-ink-soft">
        No sign-up. The room disappears after the party.
      </p>
    </main>
  );
}

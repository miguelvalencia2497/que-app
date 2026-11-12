import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { roomCodeSchema } from '../../shared/schemas';
import { AddVideoForm } from '../components/AddVideoForm';
import { ErrorToast } from '../components/ErrorToast';
import { Mascot } from '../components/Mascot';
import { NamePrompt } from '../components/NamePrompt';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { QueueRow } from '../components/QueueRow';
import { RoomHeader } from '../components/RoomHeader';
import { roomExists } from '../lib/api';
import { connectToRoom, sendAction } from '../lib/socket';
import { getClientId, getHostToken, getName, setName } from '../lib/storage';
import { useRoomStore } from '../store/roomStore';

type Phase = 'checking' | 'missing' | 'ready';

export function RoomPage() {
  const params = useParams();
  const parsedCode = roomCodeSchema.safeParse(params.code?.toUpperCase());
  const code = parsedCode.success ? parsedCode.data : null;

  const [phase, setPhase] = useState<Phase>('checking');
  const [name, setNameState] = useState(getName);

  useEffect(() => {
    if (!code) return setPhase('missing');
    let cancelled = false;
    roomExists(code)
      .then((exists) => !cancelled && setPhase(exists ? 'ready' : 'missing'))
      .catch(() => !cancelled && setPhase('missing'));
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (phase !== 'ready' || !code || !name) return;
    return connectToRoom(code, {
      type: 'hello',
      clientId: getClientId(),
      name,
      role: 'phone',
      hostToken: getHostToken(code) ?? undefined,
    });
  }, [phase, code, name]);

  if (phase === 'checking') return <CenteredMessage title="Finding the room…" />;
  if (phase === 'missing' || !code) {
    return <CenteredMessage title="There’s no room with that code." showHomeLink />;
  }
  if (!name) {
    return (
      <NamePrompt
        roomCode={code}
        onSubmit={(value) => {
          setName(value);
          setNameState(value);
        }}
      />
    );
  }
  return <RoomView code={code} />;
}

function RoomView({ code }: { code: string }) {
  const status = useRoomStore((s) => s.status);
  const room = useRoomStore((s) => s.room);
  const you = useRoomStore((s) => s.you);

  if (status === 'gone') return <CenteredMessage title="This room has ended." showHomeLink />;
  if (!room || !you) return <CenteredMessage title="Joining…" />;

  const canControl = you.isHost || room.settings.guestControls;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <RoomHeader code={code} />
      {status === 'reconnecting' && (
        <p className="mx-5 rounded-full bg-sunny-soft px-4 py-1.5 text-center font-bold text-sunny-ink">
          Reconnecting…
        </p>
      )}
      <main className="flex flex-1 flex-col gap-4 px-5 pt-2 pb-6">
        <NowPlayingCard
          item={room.nowPlaying}
          playback={room.playback}
          canControl={canControl}
          onControl={(action) => sendAction({ type: 'control', action })}
        />
        <section aria-labelledby="up-next" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 id="up-next" className="text-2xl font-extrabold">
              Up next
            </h2>
            <span className="text-sm font-medium text-ink-soft">
              {room.queue.length} {room.queue.length === 1 ? 'video' : 'videos'} ·{' '}
              {room.members.filter((m) => m.isOnline).length} here
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {room.queue.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                isMine={item.addedBy === you.clientId}
                canRemove={you.isHost || item.addedBy === you.clientId}
                onRemove={(itemId) => sendAction({ type: 'remove', itemId })}
              />
            ))}
          </ul>
        </section>
      </main>
      <div className="sticky bottom-0 flex flex-col gap-3 bg-lilac px-5 pt-3 pb-7">
        <ErrorToast />
        <AddVideoForm onAdd={(videoId) => sendAction({ type: 'add', videoId })} />
      </div>
    </div>
  );
}

function CenteredMessage({ title, showHomeLink }: { title: string; showHomeLink?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Mascot size="lg" />
      <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
      {showHomeLink && (
        <Link to="/" className="font-bold text-grape-deep underline underline-offset-4">
          Back to the start
        </Link>
      )}
    </main>
  );
}

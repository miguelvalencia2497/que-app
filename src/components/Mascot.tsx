type MascotProps = {
  size?: 'sm' | 'lg';
  mood?: 'happy' | 'worried';
};

const SIZES = {
  sm: {
    box: 'h-12 w-14.5 gap-1.5 rounded-mascot-sm',
    eye: 'size-4 p-0.5',
    pupil: 'size-1.75',
    antenna: 'h-3 w-0.75 -top-2.5',
    mouth: 'bottom-1.75 h-1.5 w-3.5',
  },
  lg: {
    box: 'h-27 w-33 gap-3.5 rounded-mascot-lg',
    eye: 'size-9 p-1.25',
    pupil: 'size-3.75',
    antenna: 'h-7.5 w-1.5 -top-6',
    mouth: 'bottom-4 h-3.25 w-7.5',
  },
} as const;

/** The queue's mascot: a little purple TV with googly eyes. */
export function Mascot({ size = 'sm', mood = 'happy' }: MascotProps) {
  const s = SIZES[size];
  const eyeAlign = mood === 'happy' ? 'items-end' : 'items-start';
  return (
    <div
      role="img"
      aria-label={
        mood === 'happy' ? 'Mascot, a little TV with googly eyes' : 'Mascot looking worried'
      }
      className={`relative flex shrink-0 -rotate-6 items-center justify-center bg-grape ${s.box}`}
    >
      <span className={`absolute left-1/4 -rotate-25 rounded-full bg-grape ${s.antenna}`} />
      <span className={`absolute right-1/4 rotate-25 rounded-full bg-grape ${s.antenna}`} />
      <span className={`flex justify-end rounded-full bg-white ${eyeAlign} ${s.eye}`}>
        <span className={`block rounded-full bg-ink ${s.pupil}`} />
      </span>
      <span className={`flex justify-start rounded-full bg-white ${eyeAlign} ${s.eye}`}>
        <span className={`block rounded-full bg-ink ${s.pupil}`} />
      </span>
      <span className={`absolute rounded-b-full bg-friend-pink ${s.mouth}`} />
    </div>
  );
}

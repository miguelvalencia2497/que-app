// Small stroke icons, sized by the parent's font-size via 1em. Decorative by default.

type IconProps = { className?: string };

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 5.5c0-.8.9-1.3 1.5-.8l9 6.5c.6.4.6 1.2 0 1.6l-9 6.5c-.6.5-1.5 0-1.5-.8z"
      />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 6v12M15 6v12" />
    </svg>
  );
}

export function SkipIcon({ className }: IconProps) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 6.5c0-.8.9-1.3 1.5-.8l7.5 5.5c.6.4.6 1.2 0 1.6l-7.5 5.5c-.6.5-1.5 0-1.5-.8z"
      />
      <rect fill="currentColor" x="16" y="5" width="3" height="14" rx="1.5" />
    </svg>
  );
}

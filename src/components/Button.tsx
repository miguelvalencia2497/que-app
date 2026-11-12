import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
};

const VARIANTS = {
  primary: 'h-16 bg-bubblegum text-white text-cta',
  secondary: 'h-14 bg-grape-deep text-white text-button',
} as const;

/** Pill button. `primary` is the one bubblegum action per screen. */
export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`flex w-full items-center justify-center gap-2.5 rounded-full font-extrabold transition active:scale-98 disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon && (
        <span className="flex size-8.5 items-center justify-center rounded-full bg-white text-bubblegum">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

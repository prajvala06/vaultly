import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-gray-900 cursor-pointer text-white hover:bg-gray-500 shadow-sm border border-transparent',
  secondary:
    'bg-gray-100 cursor-pointer text-gray-600 border border-gray-300 hover:bg-gray-200 hover:border-gray-400',
  ghost:
    'bg-transparent text-vaultly-ink-soft cursor-pointer border border-transparent hover:bg-vaultly-accent-soft',
  danger: 'bg-vaultly-danger-soft cursor-pointer text-vaultly-danger border border-transparent hover:bg-rose-100',
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

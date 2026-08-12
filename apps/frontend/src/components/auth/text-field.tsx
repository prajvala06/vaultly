import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
};

export function TextField({
  label,
  error,
  hint,
  rightSlot,
  id,
  className = '',
  ...props
}: TextFieldProps): React.ReactElement {
  const fieldId: string = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-[13px] font-medium text-vaultly-ink">{label}</span>
      <span className="relative block">
        <input
          id={fieldId}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-vaultly-ink outline-none transition-all placeholder:text-[#a3a3a3] focus:ring-4 ${
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
              : 'border-[#e5e5e5] focus:border-vaultly-ink/40 focus:ring-black/[0.04]'
          } ${rightSlot ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {rightSlot ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2">{rightSlot}</span>
        ) : null}
      </span>
      {error ? <span className="block text-xs text-vaultly-danger">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-[#737373]">{hint}</span> : null}
    </label>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { REGISTER_OTP_LENGTH } from '@vaultly/shared';

type OtpPinInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
};

function sanitizeDigits(rawValue: string, length: number): string {
  return rawValue.replace(/\D/g, '').slice(0, length);
}

export function OtpPinInput({
  value,
  onChange,
  length = REGISTER_OTP_LENGTH,
  error,
  autoFocus = true,
  disabled = false,
}: OtpPinInputProps): React.ReactElement {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState<string[]>(() => {
    const next: string[] = Array.from({ length }, () => '');
    sanitizeDigits(value, length)
      .split('')
      .forEach((digit, index) => {
        next[index] = digit;
      });
    return next;
  });

  useEffect(() => {
    const next: string[] = Array.from({ length }, () => '');
    sanitizeDigits(value, length)
      .split('')
      .forEach((digit, index) => {
        next[index] = digit;
      });
    setDigits(next);
  }, [value, length]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }
    inputRefs.current[0]?.focus();
  }, [autoFocus, disabled]);

  function emitChange(nextDigits: string[]): void {
    setDigits(nextDigits);
    onChange(nextDigits.join(''));
  }

  function focusIndex(index: number): void {
    const target: HTMLInputElement | null | undefined = inputRefs.current[index];
    target?.focus();
    target?.select();
  }

  function handleChange(index: number, rawValue: string): void {
    const cleaned: string = sanitizeDigits(rawValue, length);
    if (cleaned.length === 0) {
      const nextDigits: string[] = [...digits];
      nextDigits[index] = '';
      emitChange(nextDigits);
      return;
    }
    if (cleaned.length > 1) {
      const nextDigits: string[] = [...digits];
      cleaned.split('').forEach((digit, offset) => {
        const targetIndex: number = index + offset;
        if (targetIndex < length) {
          nextDigits[targetIndex] = digit;
        }
      });
      emitChange(nextDigits);
      const nextFocus: number = Math.min(index + cleaned.length, length - 1);
      focusIndex(nextFocus);
      return;
    }
    const nextDigits: string[] = [...digits];
    nextDigits[index] = cleaned;
    emitChange(nextDigits);
    if (index < length - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      const nextDigits: string[] = [...digits];
      nextDigits[index - 1] = '';
      emitChange(nextDigits);
      focusIndex(index - 1);
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    const pasted: string = sanitizeDigits(event.clipboardData.getData('text'), length);
    if (!pasted) {
      return;
    }
    const nextDigits: string[] = Array.from({ length }, () => '');
    pasted.split('').forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    emitChange(nextDigits);
    focusIndex(Math.min(pasted.length, length) - 1);
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-[13px] font-medium text-vaultly-ink">Confirmation code</span>
      <div className="flex items-center justify-between gap-2.5" role="group" aria-label="Confirmation code">
        {digits.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1} of ${length}`}
            maxLength={length}
            disabled={disabled}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.currentTarget.select()}
            className={`h-14 w-full rounded-xl border bg-white text-center text-xl font-semibold tracking-widest text-vaultly-ink outline-none transition-all focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                : 'border-[#e5e5e5] focus:border-vaultly-ink/40 focus:ring-black/[0.04]'
            }`}
          />
        ))}
      </div>
      {error ? <span className="block text-xs text-vaultly-danger">{error}</span> : null}
    </div>
  );
}

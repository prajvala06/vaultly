'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloseIcon } from '@/components/icons';

export type ToastTone = 'error' | 'success' | 'info';

export type ToastInput = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  title: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4200;

function resolveTitle(tone: ToastTone, title?: string): string {
  if (title) {
    return title;
  }
  if (tone === 'error') {
    return 'Something went wrong';
  }
  if (tone === 'success') {
    return 'Success';
  }
  return 'Notice';
}

function toneClasses(tone: ToastTone): string {
  if (tone === 'error') {
    return 'border-rose-200 bg-white text-vaultly-ink shadow-[0_12px_40px_rgba(225,29,72,0.12)]';
  }
  if (tone === 'success') {
    return 'border-emerald-200 bg-white text-vaultly-ink shadow-[0_12px_40px_rgba(16,185,129,0.12)]';
  }
  return 'border-black/10 bg-white text-vaultly-ink shadow-[0_12px_40px_rgba(0,0,0,0.1)]';
}

function toneAccent(tone: ToastTone): string {
  if (tone === 'error') {
    return 'bg-rose-500';
  }
  if (tone === 'success') {
    return 'bg-emerald-500';
  }
  return 'bg-vaultly-ink';
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timerId: number | undefined = timersRef.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (input: ToastInput) => {
      const tone: ToastTone = input.tone ?? 'info';
      const id: string = crypto.randomUUID();
      const durationMs: number = input.durationMs ?? DEFAULT_DURATION_MS;
      const toast: ToastItem = {
        id,
        tone,
        durationMs,
        title: resolveTitle(tone, input.title),
        message: input.message,
      };
      setToasts((current) => [...current, toast].slice(-4));
      const timerId: number = window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      timersRef.current.set(id, timerId);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      dismissToast,
    }),
    [pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
              className={`pointer-events-auto relative w-full max-w-[360px] overflow-hidden rounded-2xl border ${toneClasses(toast.tone)}`}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${toneAccent(toast.tone)}`} />
              <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight">{toast.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[#5f5f5f]">{toast.message}</p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-lg p-1 text-[#8b8b8b] transition-colors hover:bg-black/[0.04] hover:text-vaultly-ink"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context: ToastContextValue | null = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }
  return context;
}

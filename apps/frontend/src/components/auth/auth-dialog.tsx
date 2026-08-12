'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CloseIcon, VaultLogoIcon } from '@/components/icons';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';

export type AuthDialogMode = 'login' | 'register';

type AuthDialogProps = {
  mode: AuthDialogMode | null;
  onClose: () => void;
  onSwitchMode: (mode: AuthDialogMode) => void;
};

function resolveDialogCopy(input: {
  mode: AuthDialogMode;
  isRegisterOtpStep: boolean;
}): { title: string; subtitle: string } {
  if (input.mode === 'register' && input.isRegisterOtpStep) {
    return {
      title: 'Confirm your email',
      subtitle: 'Enter the 4-digit code we just sent you.',
    };
  }
  if (input.mode === 'register') {
    return {
      title: 'Create your account',
      subtitle: 'Set up your vault in under a minute.',
    };
  }
  return {
    title: 'Welcome back',
    subtitle: 'Sign in to continue to Vaultly.',
  };
}

export function AuthDialog({ mode, onClose, onSwitchMode }: AuthDialogProps): React.ReactElement {
  const isOpen: boolean = mode !== null;
  const [isRegisterOtpStep, setIsRegisterOtpStep] = useState<boolean>(false);
  const copy = mode
    ? resolveDialogCopy({ mode, isRegisterOtpStep })
    : { title: '', subtitle: '' };

  useEffect(() => {
    if (mode !== 'register') {
      setIsRegisterOtpStep(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    const previousOverflow: string = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && mode ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close authentication dialog"
            className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
            className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-[#8b8b8b] transition-colors hover:bg-[#f4f4f4] hover:text-vaultly-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            <div className="px-7 pt-8 pb-2 text-center">
           
              <h2
                id="auth-dialog-title"
                className="mt-4 text-[1.35rem] font-semibold tracking-tight text-vaultly-ink"
              >
                {copy.title}
              </h2>
              <p className="mt-1.5 text-sm text-[#6b6b6b]">{copy.subtitle}</p>
            </div>

            {!isRegisterOtpStep ? (
              <div className="px-7 pt-4">
                <div className="grid grid-cols-2 rounded-xl bg-[#f5f5f5] p-1">
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className={
                      mode === 'login'
                        ? 'rounded-lg bg-white px-3 py-2 text-sm font-semibold text-vaultly-ink shadow-sm'
                        : 'rounded-lg px-3 py-2 text-sm font-medium text-[#6b6b6b] transition-colors hover:text-vaultly-ink'
                    }
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('register')}
                    className={
                      mode === 'register'
                        ? 'rounded-lg bg-white px-3 py-2 text-sm font-semibold text-vaultly-ink shadow-sm'
                        : 'rounded-lg px-3 py-2 text-sm font-medium text-[#6b6b6b] transition-colors hover:text-vaultly-ink'
                    }
                  >
                    Sign up
                  </button>
                </div>
              </div>
            ) : null}

            <div className="max-h-[min(70vh,560px)] overflow-y-auto px-7 pt-5 pb-7">
              {mode === 'login' ? (
                <LoginForm
                  showModeSwitch={false}
                  onSwitchToRegister={() => onSwitchMode('register')}
                />
              ) : (
                <RegisterForm
                  showModeSwitch={false}
                  onSwitchToLogin={() => onSwitchMode('login')}
                  onOtpStepChange={setIsRegisterOtpStep}
                />
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

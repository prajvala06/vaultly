'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  REGISTER_OTP_LENGTH,
  registerSchema,
  verifyRegisterOtpSchema,
  type RegisterInput,
  type VerifyRegisterOtpInput,
} from '@vaultly/shared';
import { OtpPinInput } from '@/components/auth/otp-pin-input';
import { TextField } from '@/components/auth/text-field';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import { saveAuthSession } from '@/lib/auth-session';

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
  showModeSwitch?: boolean;
  onOtpStepChange?: (isOtpStep: boolean) => void;
};

type RegisterChallengeData = {
  email: string;
  message: string;
};

type VerifyOtpData = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function RegisterForm({
  onSwitchToLogin,
  showModeSwitch = true,
  onOtpStepChange,
}: RegisterFormProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const credentialsForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const otpForm = useForm<VerifyRegisterOtpInput>({
    resolver: zodResolver(verifyRegisterOtpSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });
  const otpCode: string = otpForm.watch('code');

  useEffect(() => {
    onOtpStepChange?.(pendingEmail !== null);
    return () => {
      onOtpStepChange?.(false);
    };
  }, [pendingEmail, onOtpStepChange]);

  async function onSubmitRegister(values: RegisterInput): Promise<void> {
    try {
      const result = await apiRequest<RegisterChallengeData>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setPendingEmail(result.email);
      otpForm.reset({ email: result.email, code: '' });
      pushToast({
        tone: 'success',
        title: 'Code sent',
        message: result.message,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: 'Could not reach the server. Is the API running?',
      });
    }
  }

  async function onSubmitOtp(values: VerifyRegisterOtpInput): Promise<void> {
    try {
      const result = await apiRequest<VerifyOtpData>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      saveAuthSession({
        name: result.user.name,
        email: result.user.email,
      });
      pushToast({
        tone: 'success',
        title: 'Account confirmed',
        message: 'Your email is verified. Welcome to Vaultly.',
      });
      const nextPath: string = searchParams.get('next') ?? '';
      router.push(nextPath.startsWith('/share/') ? nextPath : '/home');
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: 'Could not reach the server. Is the API running?',
      });
    }
  }

  async function onResendCode(): Promise<void> {
    if (!pendingEmail) {
      return;
    }
    try {
      const result = await apiRequest<RegisterChallengeData>('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail }),
      });
      otpForm.setValue('code', '');
      pushToast({
        tone: 'success',
        title: 'Code resent',
        message: result.message,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: 'Could not reach the server. Is the API running?',
      });
    }
  }

  if (pendingEmail) {
    return (
      <form className="space-y-4" onSubmit={otpForm.handleSubmit(onSubmitOtp)} noValidate>
        <p className="rounded-xl border border-black/8 bg-[#f7f7f7] px-3 py-2 text-xs leading-relaxed text-[#4a4a4a]">
          Enter the {REGISTER_OTP_LENGTH}-digit code sent to{' '}
          <span className="font-semibold text-vaultly-ink">{pendingEmail}</span>.
        </p>
        <input type="hidden" {...otpForm.register('email')} />
        <input type="hidden" {...otpForm.register('code')} />
        <OtpPinInput
          value={otpCode}
          disabled={otpForm.formState.isSubmitting}
          error={otpForm.formState.errors.code?.message}
          onChange={(nextCode) => {
            otpForm.setValue('code', nextCode, {
              shouldValidate: nextCode.length === REGISTER_OTP_LENGTH,
              shouldDirty: true,
            });
          }}
        />
        <button
          type="submit"
          disabled={otpForm.formState.isSubmitting || otpCode.length !== REGISTER_OTP_LENGTH}
          className="mt-1 w-full rounded-xl bg-vaultly-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-vaultly-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {otpForm.formState.isSubmitting ? 'Confirming...' : 'Confirm code'}
        </button>
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPendingEmail(null)}
            className="font-medium text-[#6b6b6b] underline-offset-2 hover:text-vaultly-ink hover:underline"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              void onResendCode();
            }}
            className="font-semibold text-vaultly-ink underline-offset-2 hover:underline"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={credentialsForm.handleSubmit(onSubmitRegister)}
      noValidate
    >
      <TextField
        label="Name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        error={credentialsForm.formState.errors.name?.message}
        {...credentialsForm.register('name')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={credentialsForm.formState.errors.email?.message}
        {...credentialsForm.register('email')}
      />
      <TextField
        label="Password"
        type={isPasswordVisible ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="Create a strong password"
        error={credentialsForm.formState.errors.password?.message}
        rightSlot={
          <button
            type="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            className="rounded-md p-1 text-[#8b8b8b] transition-colors hover:text-vaultly-ink"
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        }
        {...credentialsForm.register('password')}
      />
      <TextField
        label="Confirm password"
        type={isPasswordVisible ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder="Re-enter your password"
        error={credentialsForm.formState.errors.confirmPassword?.message}
        {...credentialsForm.register('confirmPassword')}
      />
      <button
        type="submit"
        disabled={credentialsForm.formState.isSubmitting}
        className="mt-1 w-full rounded-xl bg-vaultly-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-vaultly-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {credentialsForm.formState.isSubmitting ? 'Sending code...' : 'Create account'}
      </button>
      <p className="text-center text-xs leading-relaxed text-[#8b8b8b]">
        We will email a {REGISTER_OTP_LENGTH}-digit code to confirm your account.
      </p>
      {showModeSwitch ? (
        <p className="text-center text-sm text-[#6b6b6b]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-vaultly-ink underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </p>
      ) : null}
    </form>
  );
}

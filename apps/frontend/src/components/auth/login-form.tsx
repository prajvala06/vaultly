'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@vaultly/shared';
import { TextField } from '@/components/auth/text-field';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import { saveAuthSession } from '@/lib/auth-session';

type LoginFormProps = {
  onSwitchToRegister?: () => void;
  showModeSwitch?: boolean;
};

type LoginData = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
};

export function LoginForm({
  onSwitchToRegister,
  showModeSwitch = true,
}: LoginFormProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    try {
      const result = await apiRequest<LoginData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      saveAuthSession({
        name: result.user.name,
        email: result.user.email,
        accessToken: result.accessToken,
      });
      pushToast({
        tone: 'success',
        title: 'Signed in',
        message: `Welcome back, ${result.user.name}.`,
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

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Password"
        type={isPasswordVisible ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
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
        {...register('password')}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-xl bg-vaultly-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-vaultly-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
      <p className="text-center text-xs leading-relaxed text-[#8b8b8b]">
        By continuing you agree to Vaultly&apos;s secure storage terms.
      </p>
      {showModeSwitch ? (
        <p className="text-center text-sm text-[#6b6b6b]">
          New here?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-vaultly-ink underline-offset-2 hover:underline"
          >
            Create an account
          </button>
        </p>
      ) : null}
    </form>
  );
}

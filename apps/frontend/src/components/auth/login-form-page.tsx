'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export function LoginFormPage(): React.ReactElement {
  const router = useRouter();
  return (
    <LoginForm
      showModeSwitch
      onSwitchToRegister={() => {
        router.push('/register');
      }}
    />
  );
}

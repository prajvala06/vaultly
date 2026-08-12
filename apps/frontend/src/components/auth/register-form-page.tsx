'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';

export function RegisterFormPage(): React.ReactElement {
  const router = useRouter();
  return (
    <RegisterForm
      showModeSwitch
      onSwitchToLogin={() => {
        router.push('/login');
      }}
    />
  );
}

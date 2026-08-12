import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in · Vaultly',
  description: 'Sign in to Vaultly to securely store, manage, and share your files.',
};

export default function LoginPage(): React.ReactElement {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your secure vault.">
      <LoginForm />
    </AuthShell>
  );
}

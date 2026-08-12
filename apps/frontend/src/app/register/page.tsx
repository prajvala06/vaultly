import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterFormPage } from '@/components/auth/register-form-page';

export const metadata: Metadata = {
  title: 'Create account · Vaultly',
  description: 'Create your Vaultly account to securely store, manage, and share your files.',
};

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start storing and sharing files securely in minutes."
    >
      <RegisterFormPage />
    </AuthShell>
  );
}

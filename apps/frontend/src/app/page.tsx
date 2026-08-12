import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LandingPage } from '@/components/landing/landing-page';

export const metadata: Metadata = {
  title: 'Vaultly — Securely store, manage, and share your files.',
  description:
    'Vaultly helps you upload large files, organize your vault, and share with private or public access controls.',
};

export default function HomePage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

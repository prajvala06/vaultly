import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vaultly',
  description: 'Securely store, manage, and share your files.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

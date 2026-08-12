import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toaster';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

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
      <body className={`${plusJakartaSans.variable} min-h-screen font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

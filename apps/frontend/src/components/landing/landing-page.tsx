'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDownIcon,
  FilesIcon,
  FolderIcon,
  ShareIcon,
  VaultLogoIcon,
} from '@/components/icons';
import { AuthDialog, type AuthDialogMode } from '@/components/auth/auth-dialog';
import { getUserInitials, readAuthSession, type AuthSessionUser } from '@/lib/auth-session';
import Image from 'next/image';

const NAV_LINKS: readonly { label: string; href: string }[] = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Security', href: '#security' },
  { label: 'Sharing', href: '#sharing' },
];

const HERO_ICONS: readonly {
  label: string;
  ring: string;
  bg: string;
  icon: React.ReactNode;
}[] = [
  {
    label: 'Vault',
    ring: 'ring-[#2383e2]',
    bg: 'bg-[#e7f3ff]',
    icon: <VaultLogoIcon className="h-5 w-5 text-[#2383e2]" />,
  },
  {
    label: 'Files',
    ring: 'ring-vaultly-ink',
    bg: 'bg-white',
    icon: <FilesIcon className="h-5 w-5 text-vaultly-ink" />,
  },
  {
    label: 'Folders',
    ring: 'ring-[#eb5757]',
    bg: 'bg-[#fde8e8]',
    icon: <FolderIcon className="h-5 w-5 text-[#eb5757]" />,
  },
  {
    label: 'Share',
    ring: 'ring-[#f2c94c]',
    bg: 'bg-[#fff8db]',
    icon: <ShareIcon className="h-5 w-5 text-[#c79200]" />,
  },
  {
    label: 'Private',
    ring: 'ring-[#9b51e0]',
    bg: 'bg-[#f3e8ff]',
    icon: <LockMark />,
  },
  {
    label: 'Upload',
    ring: 'ring-[#27ae60]',
    bg: 'bg-[#e8f8ef]',
    icon: <UploadMark />,
  },
  {
    label: 'Secure',
    ring: 'ring-[#f2994a]',
    bg: 'bg-[#fff1e6]',
    icon: <ShieldMark />,
  },
];

export function LandingPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthDialogMode | null>(null);
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const isSignedIn: boolean = user !== null;

  useEffect(() => {
    const session: AuthSessionUser | null = readAuthSession();
    setUser(session);
    if (session) {
      return;
    }
    const authParam: string | null = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'register') {
      setAuthMode(authParam);
    }
  }, [searchParams]);

  function handleCloseAuth(): void {
    setAuthMode(null);
    const nextPath: string | null = searchParams.get('next');
    if (nextPath && nextPath.startsWith('/share/')) {
      router.replace(`/?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    router.replace('/');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-vaultly-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/vaultly-landing-bg-white.png')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0.55)_45%,_rgba(255,255,255,0.15)_70%,_transparent_100%)]"
      />

      <header className="relative z-20 h-32 w-full bg-gradient-to-b from-white via-white/95 to-white/0">
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center justify-center gap-2">
              <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
            <span className="text-2xl font-semibold uppercase tracking-tight">Vaultly</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-lg text-vaultly-ink/80 transition-colors hover:bg-black/[0.03] hover:text-vaultly-ink"
              >
                {link.label}
                <ChevronDownIcon className="h-6 w-6 opacity-50" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/home"
                  className="px-5 py-3 text-lg font-semibold text-vaultly-ink transition-colors hover:bg-vaultly-surface-muted"
                >
                  My Vault
                </Link>
                <Link
                  href="/home"
                  aria-label="Open vault"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-xs font-bold text-white"
                >
                  {getUserInitials(user)}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="rounded-[6px] border border-vaultly-ink bg-white px-5 py-3 text-lg font-semibold text-vaultly-ink transition-colors hover:bg-vaultly-surface-muted"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="rounded-[6px] bg-vaultly-ink px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-vaultly-ink/80"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-h-screen w-full max-w-4xl flex-col items-center justify-center px-5 pt-10 text-center sm:px-8">
        <div className="mb-8 flex items-center justify-center -space-x-2">
          {HERO_ICONS.map((item, index) => (
            <motion.span
              key={item.label}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.04 * index, duration: 0.35, ease: 'easeOut' }}
              title={item.label}
              className={`relative flex h-12 w-12 items-center justify-center rounded-full ${item.bg} ring-2 ${item.ring} shadow-sm`}
            >
              {item.icon}
            </motion.span>
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
          className="max-w-3xl text-[2.5rem] leading-[1.08] font-bold tracking-[-0.03em] text-vaultly-ink sm:text-6xl md:text-[4.25rem]"
        >
          <span className="mt-2 block font-semibold sm:mt-3">
            <span className="relative inline-flex items-center gap-2 rounded-full bg-[#ffd7b9] px-3 py-0.5 text-vaultly-ink sm:px-4">
              Store
            </span>{' '}
            <span className="relative inline-flex items-center rounded-full py-0.5 text-vaultly-ink">
              , manage
            </span>{' '}
            <span className="relative inline-flex items-center gap-2 rounded-full bg-[#c4f99d] px-3 py-0.5 text-vaultly-ink sm:px-4">
              , and
            </span>
            <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-vaultly-ink sm:px-4 mt-4">
              Share
            </span>
            <span className="relative inline-flex items-center gap-2 rounded-full bg-[#ade9fd] px-3 py-0.5 text-vaultly-ink sm:px-4">
              Securely
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-[#5a5a5a] sm:text-lg"
        >
          Upload large files, organize your vault, and control private or public access — all in one
          calm, colorful workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {isSignedIn ? (
            <Link
              href="/home"
              className="rounded-[6px] bg-vaultly-ink px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-vaultly-ink/80"
            >
              Open vault
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="rounded-[6px] bg-vaultly-ink px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-vaultly-ink/80"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="rounded-[6px] border border-vaultly-ink bg-white px-5 py-3 text-lg font-semibold text-vaultly-ink transition-colors hover:bg-vaultly-surface-muted"
              >
                Log in
              </button>
            </>
          )}
        </motion.div>
      </section>

      <AuthDialog
        mode={isSignedIn ? null : authMode}
        onClose={handleCloseAuth}
        onSwitchMode={setAuthMode}
      />
    </main>
  );
}

function LockMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#9b51e0]" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function UploadMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#27ae60]" fill="none" aria-hidden="true">
      <path
        d="M12 16V7M8.5 10.5 12 7l3.5 3.5M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f2994a]" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 19 6.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5l7-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12 1.8 1.8L15 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

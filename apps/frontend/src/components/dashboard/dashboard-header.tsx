'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon } from '@/components/icons';
import { DashboardSearch } from '@/components/dashboard/dashboard-search';
import { Button } from '@/components/ui/button';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import {
  clearAuthSession,
  getDisplayFirstName,
  getUserInitials,
  readAuthSession,
  type AuthSessionUser,
} from '@/lib/auth-session';
import type { VaultFile } from '@/lib/vault-file';
import { useToast } from '@/components/ui/toaster';

type DashboardHeaderProps = {
  files: VaultFile[];
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSelectFile: (fileId: string) => void;
  onOpenMenu?: () => void;
};

export function DashboardHeader({
  files,
  searchQuery = '',
  onSearchChange,
  onSelectFile,
  onOpenMenu,
}: DashboardHeaderProps): React.ReactElement {
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const initials: string = getUserInitials(user);
  const { pushToast } = useToast();

  useEffect(() => {
    setUser(readAuthSession());
  }, []);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent): void {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  async function handleLogout(): Promise<void> {
    try {
      await apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        // Ignore offline logout failures and clear local session anyway.
      }
    }
    clearAuthSession();
    router.push('/');
  }

  return (
    <header className="shrink-0 ">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:gap-4 sm:px-6 xl:px-8">
        <DashboardSearch
          files={files}
          searchQuery={searchQuery}
          onSearchChange={(value) => onSearchChange?.(value)}
          onSelectFile={onSelectFile}
          onOpenMenu={onOpenMenu}
        />
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
                pushToast({
                    title: 'Notifications',
                    message: 'You have no notifications',
                    tone: 'info',
                });
            }}
            className="relative flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <BellIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            {/* <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-vaultly-accent" /> */}
          </button>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-900 text-xs font-bold text-white"
            >
              {initials}
            </button>
            <AnimatePresence>
              {isProfileOpen ? (
                <motion.div
                  className="absolute top-12 right-0 z-30 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <div className="mb-3 flex items-center gap-3 px-1 py-1">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-xs font-bold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-vaultly-ink">
                        {user?.name ?? 'Vaultly user'}
                      </p>
                      <p className="truncate text-xs text-vaultly-muted">{user?.email ?? ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => {
                      setIsProfileOpen(false);
                      void handleLogout();
                    }}
                  >
                    Log out
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

type DashboardPageIntroProps = {
  isHome?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function DashboardPageIntro({
  isHome = false,
  title,
  subtitle,
  actions,
}: DashboardPageIntroProps): React.ReactElement {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const firstName: string = getDisplayFirstName(user);

  useEffect(() => {
    setUser(readAuthSession());
  }, []);

  if (isHome) {
    return (
      <div>
        <p className="text-sm font-medium text-vaultly-accent md:text-base">Welcome back</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-vaultly-ink">
          Hi {firstName}, here is your vault
        </h1>
        <p className="mt-1 text-sm text-vaultly-muted md:text-base">
          Manage and securely share your files with a colorful, calm workspace.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-vaultly-ink">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-vaultly-muted md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

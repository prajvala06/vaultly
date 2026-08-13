'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { StorageSummaryDto } from '@vaultly/shared';
import {
  ClockIcon,
  CloseIcon,
  FilesIcon,
  FolderVaultIcon,
  HomeIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UsersIcon,
} from '@/components/icons';
import { useToast } from '@/components/ui/toaster';
import { EMPTY_STORAGE_SUMMARY } from '@/lib/vault-file';
import { Button } from '../ui/button';
import Image from 'next/image';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

type SidebarProps = {
  storage?: StorageSummaryDto;
  onNewClick: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

type SidebarBodyProps = {
  storage: StorageSummaryDto;
  onNewClick: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
};

const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', icon: <HomeIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/home' },
  { label: 'My Vault', icon: <FolderVaultIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/my-vault' },
  { label: 'Recent', icon: <ClockIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/recent' },
  { label: 'Shared with me', icon: <UsersIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/shared-with-me' },
  { label: 'Trash', icon: <TrashIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/trash' },
];

function SidebarBody({
  storage,
  onNewClick,
  onNavigate,
  onClose,
}: SidebarBodyProps): React.ReactElement {
  const pathname = usePathname();
  const { pushToast } = useToast();

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14"
          />
          <span className="text-lg font-semibold tracking-tight uppercase md:text-xl lg:text-2xl">
            Vaultly
          </span>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div className="mb-4 h-0.5 w-full bg-gray-600" />
      <Button
        variant="secondary"
        onClick={() => {
          onNavigate?.();
          onNewClick();
        }}
        className="mx-4 rounded-full px-5"
      >
        <PlusIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
        New
      </Button>
      <nav className="mt-6 flex flex-1 flex-col overflow-y-auto px-3 pb-4">
        <ul className="space-y-1.5">
          {PRIMARY_NAV.map((item) => {
            const isActive: boolean = item.path === pathname;
            return (
              <li key={item.label}>
                <Link
                  href={item.path}
                  onClick={onNavigate}
                  className={
                    isActive
                      ? 'flex w-full items-center gap-3 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white'
                      : 'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white'
                  }
                >
                  {item.icon}
                  <span className="flex-1 text-left text-sm md:text-base">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] tracking-wide text-white/55 uppercase">
            <span>Storage</span>
            <span className="normal-case tracking-normal">
              {storage.usedLabel} of {storage.quotaLabel}
            </span>
          </div>
          <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/70"
              style={{ width: `${Math.max(storage.usedPercent, 2)}%` }}
            />
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-[#111827] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
            onClick={() => {
              pushToast({
                title: 'Upgrade to Pro',
                message: 'Coming soon',
                tone: 'info',
                durationMs: 3000,
              });
            }}
          >
            Upgrade
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar({
  storage = EMPTY_STORAGE_SUMMARY,
  onNewClick,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps): React.ReactElement {
  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }
    const previousOverflow: string = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onMobileClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-[#1b2430] text-white md:flex">
        <SidebarBody storage={storage} onNewClick={onNewClick} />
      </aside>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col border-r border-slate-800 bg-[#1b2430] text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <SidebarBody
              storage={storage}
              onNewClick={onNewClick}
              onNavigate={onMobileClose}
              onClose={onMobileClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

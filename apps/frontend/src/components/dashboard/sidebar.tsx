'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { StorageSummaryDto } from '@vaultly/shared';
import {
  ClockIcon,
  FilesIcon,
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
};

const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', icon: <HomeIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/home' },
  { label: 'My Files', icon: <FilesIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/my-files' },
  { label: 'Recent', icon: <ClockIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/recent' },
  { label: 'Shared with me', icon: <UsersIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/shared-with-me' },
  { label: 'Starred', icon: <StarIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/starred' },
  { label: 'Trash', icon: <TrashIcon className="h-5 w-5 md:h-6 md:w-6" />, path: '/trash' },
];

export function Sidebar({ storage = EMPTY_STORAGE_SUMMARY, onNewClick }: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const { pushToast } = useToast();

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-[#1b2430] text-white md:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
        <span className="text-lg md:text-xl lg:text-2xl font-semibold uppercase tracking-tight">Vaultly</span>
      </div>
      <div className="h-0.5 w-full bg-gray-600 mb-4"></div>
      <Button variant="secondary" onClick={onNewClick} className="rounded-full mx-4 px-5">
        <PlusIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
        New
      </Button>
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-4 mt-6">
        <ul className="space-y-1.5">
          {PRIMARY_NAV.map((item) => {
            const isActive: boolean = item.path === pathname;
            return (
              <li key={item.label}>
                <Link
                  href={item.path}
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
    </aside>
  );
}

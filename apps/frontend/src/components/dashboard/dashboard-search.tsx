'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserLookupDto, UserLookupResponse, VaultFolderDto } from '@vaultly/shared';
import { FilesIcon, FolderIcon, MenuIcon, SearchIcon, UsersIcon } from '@/components/icons';
import { FileTypeIcon } from '@/components/ui/badges';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import { isCompleteEmail } from '@/lib/search';
import { buildFolderQueryValue } from '@/lib/folder-selection';
import type { VaultFile } from '@/lib/vault-file';
import { useVaultFolders } from '@/hooks/use-vault-folders';

const MAX_RESULTS_PER_SECTION = 5;

type DashboardSearchProps = {
  files: readonly VaultFile[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectFile: (fileId: string) => void;
  onOpenMenu?: () => void;
};

type SearchSectionProps = {
  title: string;
  children: React.ReactNode;
};

function SearchSection({ title, children }: SearchSectionProps): React.ReactElement {
  return (
    <div className="px-2 py-2">
      <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MatchedUserRow({ user }: { user: UserLookupDto }): React.ReactElement {
  return (
    <SearchSection title="People">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vaultly-blue-soft">
          <UsersIcon className="h-4 w-4 text-vaultly-blue" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-vaultly-ink">{user.name}</span>
          <span className="block truncate text-xs text-vaultly-muted">{user.email}</span>
        </span>
      </div>
    </SearchSection>
  );
}

export function DashboardSearch({
  files,
  searchQuery,
  onSearchChange,
  onSelectFile,
  onOpenMenu,
}: DashboardSearchProps): React.ReactElement {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const { folders } = useVaultFolders();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<UserLookupDto | null>(null);
  const [isUserLookupLoading, setIsUserLookupLoading] = useState<boolean>(false);

  const trimmedQuery: string = searchQuery.trim();
  const normalizedQuery: string = trimmedQuery.toLowerCase();
  const shouldLookupUser: boolean = isCompleteEmail(trimmedQuery);

  const matchedFiles = useMemo((): readonly VaultFile[] => {
    if (!normalizedQuery) {
      return [];
    }
    return files
      .filter((file) => file.name.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS_PER_SECTION);
  }, [files, normalizedQuery]);

  const matchedFolders = useMemo((): readonly VaultFolderDto[] => {
    if (!normalizedQuery) {
      return [];
    }
    return folders
      .filter((folder) => folder.name.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_RESULTS_PER_SECTION);
  }, [folders, normalizedQuery]);

  const hasFileOrFolderMatches: boolean =
    matchedFiles.length > 0 || matchedFolders.length > 0;
  const hasUserMatch: boolean = matchedUser !== null;
  const showResults: boolean =
    isOpen &&
    trimmedQuery.length > 0 &&
    (hasFileOrFolderMatches || shouldLookupUser || hasUserMatch);

  useEffect(() => {
    if (!shouldLookupUser) {
      setMatchedUser(null);
      setIsUserLookupLoading(false);
      return;
    }
    let isCancelled = false;
    setIsUserLookupLoading(true);
    const timeoutId: number = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await apiRequest<UserLookupResponse>(
            `/api/users/lookup?email=${encodeURIComponent(trimmedQuery)}`,
          );
          if (!isCancelled) {
            setMatchedUser(result.user);
          }
        } catch (error) {
          if (!isCancelled) {
            setMatchedUser(null);
            if (!(error instanceof ApiClientError)) {
              setMatchedUser(null);
            }
          }
        } finally {
          if (!isCancelled) {
            setIsUserLookupLoading(false);
          }
        }
      })();
    }, 300);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [shouldLookupUser, trimmedQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent): void {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelectFile(fileId: string): void {
    onSelectFile(fileId);
    setIsOpen(false);
  }

  function handleSelectFolder(folderId: string): void {
    const queryValue: string = buildFolderQueryValue(folderId, folders);
    if (!queryValue) {
      router.push('/my-files');
      setIsOpen(false);
      return;
    }
    router.push(`/my-files?folder=${encodeURIComponent(queryValue)}`);
    setIsOpen(false);
  }

  const showEmptyState: boolean =
    trimmedQuery.length > 0 &&
    !hasFileOrFolderMatches &&
    !hasUserMatch &&
    !(shouldLookupUser && isUserLookupLoading) &&
    !shouldLookupUser;

  return (
    <div ref={searchRef} className="relative min-w-0 flex-1 max-w-xl">
      <div className="flex items-center gap-2">
        {onOpenMenu ? (
          <button
            type="button"
            aria-label="Open menu"
            onClick={onOpenMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        ) : null}
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              onSearchChange(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search files, folders, or people..."
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-vaultly-ink outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
          />
        </label>
      </div>
      {showResults ? (
        <div className="absolute top-[calc(100%+8px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          {matchedFiles.length > 0 ? (
            <SearchSection title="Files">
              {matchedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => handleSelectFile(file.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vaultly-accent-soft">
                    <FileTypeIcon type={file.type} className="h-4 w-4 text-vaultly-accent" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-vaultly-ink">
                      {file.name}
                    </span>
                    <span className="block truncate text-xs text-vaultly-muted">
                      {file.sizeLabel} · {file.mimeLabel}
                    </span>
                  </span>
                </button>
              ))}
            </SearchSection>
          ) : null}
          {matchedFolders.length > 0 ? (
            <SearchSection title="Folders">
              {matchedFolders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelectFolder(folder.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vaultly-teal-soft">
                    <FolderIcon className="h-4 w-4 text-vaultly-teal" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-vaultly-ink">
                      {folder.name}
                    </span>
                    <span className="block truncate text-xs text-vaultly-muted">
                      {folder.fileCount === 1 ? '1 file' : `${folder.fileCount} files`}
                    </span>
                  </span>
                </button>
              ))}
            </SearchSection>
          ) : null}
          {shouldLookupUser && isUserLookupLoading ? (
            <SearchSection title="People">
              <p className="px-2 py-2 text-sm text-vaultly-muted">Looking up user...</p>
            </SearchSection>
          ) : null}
          {matchedUser ? <MatchedUserRow user={matchedUser} /> : null}
          {shouldLookupUser && !isUserLookupLoading && !hasUserMatch ? (
            <SearchSection title="People">
              <p className="px-2 py-2 text-sm text-vaultly-muted">No Vaultly user found for this email.</p>
            </SearchSection>
          ) : null}
          {showEmptyState ? (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-vaultly-muted">
              <FilesIcon className="h-4 w-4 shrink-0" />
              <span>No matches found</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

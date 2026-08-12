'use client';

import { useMemo, useState } from 'react';
import { FileTable } from '@/components/dashboard/file-table';
import { FileToolbar } from '@/components/dashboard/file-toolbar';
import { useVaultUpload, VaultChrome } from '@/components/dashboard/vault-chrome';
import { FileTypeIcon, getFileTypeTone } from '@/components/ui/badges';
import { FilesShimmerLoader } from '@/components/ui/shimmer';
import { useVaultFiles } from '@/hooks/use-vault-files';
import type { VaultFile } from '@/lib/vault-file';
import {
  applyFileFilter,
  applyFileSort,
  type FileFilter,
  type FileSort,
} from '@/lib/file-list';
import {
  filterFilesByVaultView,
  getVaultViewCopy,
  type VaultView,
} from '@/lib/vault-view';
import Image from 'next/image';

type ViewMode = 'list' | 'grid';

type DashboardShellProps = {
  view: Exclude<VaultView, 'home' | 'my-files'>;
};

export function DashboardShell({ view }: DashboardShellProps): React.ReactElement {
  const filesScope =
    view === 'shared-with-me' ? 'shared-with-me' : view === 'trash' ? 'trash' : 'owned';
  const {
    files,
    isLoading,
    searchQuery,
    selectedFileId,
    setSearchQuery,
    setSelectedFileId,
  } = useVaultFiles(filesScope);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [fileSort, setFileSort] = useState<FileSort>('modified-desc');
  const viewCopy = getVaultViewCopy(view);
  const canUploadInEmptyState: boolean = view === 'recent';
  const filteredFiles = useMemo(() => {
    const viewFiles = filterFilesByVaultView(files, view);
    const query = searchQuery.trim().toLowerCase();
    const searchedFiles = query
      ? viewFiles.filter((file) => file.name.toLowerCase().includes(query))
      : viewFiles;
    return applyFileSort(applyFileFilter(searchedFiles, fileFilter), fileSort);
  }, [files, view, searchQuery, fileFilter, fileSort]);

  return (
    <VaultChrome
      title={viewCopy.title}
      subtitle={viewCopy.subtitle}
      readOnlyFiles={view === 'shared-with-me'}
      isTrashView={view === 'trash'}
    >
      <FileToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fileFilter={fileFilter}
        onFileFilterChange={setFileFilter}
        fileSort={fileSort}
        onFileSortChange={setFileSort}
      />
      {isLoading ? (
        <FilesShimmerLoader viewMode={viewMode} />
      ) : viewMode === 'list' ? (
        <ViewFileTable
          files={filteredFiles}
          selectedFileId={selectedFileId}
          onSelectFile={(fileId) => setSelectedFileId(fileId)}
          emptyTitle={viewCopy.emptyTitle}
          emptyMessage={viewCopy.emptyMessage}
          showUploadAction={canUploadInEmptyState}
        />
      ) : (
        <FileGrid
          files={filteredFiles}
          selectedFileId={selectedFileId}
          onSelectFile={(fileId) => setSelectedFileId(fileId)}
          emptyTitle={viewCopy.emptyTitle}
          emptyMessage={viewCopy.emptyMessage}
        />
      )}
    </VaultChrome>
  );
}

type ViewFileTableProps = {
  files: readonly VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  emptyTitle: string;
  emptyMessage: string;
  showUploadAction: boolean;
};

function ViewFileTable({
  files,
  selectedFileId,
  onSelectFile,
  emptyTitle,
  emptyMessage,
  showUploadAction,
}: ViewFileTableProps): React.ReactElement {
  const { openUploadPanel } = useVaultUpload();
  return (
    <FileTable
      files={files}
      selectedFileId={selectedFileId}
      onSelectFile={onSelectFile}
      onUploadClick={openUploadPanel}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      showUploadAction={showUploadAction}
    />
  );
}

type FileGridProps = {
  files: readonly VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  emptyTitle: string;
  emptyMessage: string;
};

function FileGrid({
  files,
  selectedFileId,
  onSelectFile,
  emptyTitle,
  emptyMessage,
}: FileGridProps): React.ReactElement {
  if (files.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-vaultly-border bg-white px-6 py-16 text-center shadow-vaultly">
        <Image
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnIngcfrKBeDgxUOATcvIMseCRJyYA8XQ8Blbh-9sx0nT4x6hDJDX7ziY&s=10"
          width={200}
          height={200}
          alt={emptyTitle}
        />
        <h3 className="text-base font-semibold text-vaultly-ink">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-vaultly-muted">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {files.map((file) => {
        const isSelected: boolean = file.id === selectedFileId;
        const tone = getFileTypeTone(file.type);
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelectFile(file.id)}
            className={
              isSelected
                ? 'rounded-3xl border border-orange-200 bg-vaultly-accent-soft p-4 text-left shadow-vaultly'
                : 'rounded-3xl border border-vaultly-border bg-white p-4 text-left transition-colors hover:bg-orange-50'
            }
          >
            <span
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${tone.wrap}`}
            >
              <FileTypeIcon type={file.type} className="h-5 w-5" />
            </span>
            <p className="truncate text-sm font-semibold text-vaultly-ink">{file.name}</p>
            <p className="mt-1 text-xs text-vaultly-muted">
              {file.sizeLabel} · {file.modifiedLabel}
            </p>
          </button>
        );
      })}
    </div>
  );
}

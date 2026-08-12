'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderCards } from '@/components/dashboard/folder-cards';
import { FileTable } from '@/components/dashboard/file-table';
import { FileToolbar } from '@/components/dashboard/file-toolbar';
import { useVaultUpload, VaultChrome } from '@/components/dashboard/vault-chrome';
import { FileTypeIcon, getFileTypeTone } from '@/components/ui/badges';
import { Button } from '@/components/ui/button';
import { FilesShimmerLoader } from '@/components/ui/shimmer';
import { UploadCloudIcon } from '@/components/icons';
import { useVaultFiles } from '@/hooks/use-vault-files';
import { useVaultFolders } from '@/hooks/use-vault-folders';
import { getVaultViewCopy } from '@/lib/vault-view';
import {
  applyFileFilter,
  applyFileSort,
  type FileFilter,
  type FileSort,
} from '@/lib/file-list';
import {
  buildFolderQueryValue,
  resolveFolderFromQuery,
} from '@/lib/folder-selection';
import type { VaultFile } from '@/lib/vault-file';
import Image from 'next/image';

type ViewMode = 'list' | 'grid';

function filterByFolder(files: readonly VaultFile[], folderId: string): readonly VaultFile[] {
  if (folderId === 'all') {
    return files;
  }
  if (
    folderId !== 'documents' &&
    folderId !== 'images' &&
    folderId !== 'archives' &&
    folderId !== 'shared'
  ) {
    return files.filter((file) => file.folderId === folderId);
  }
  if (folderId === 'documents') {
    return files.filter((file) => file.type === 'pdf' || file.type === 'doc');
  }
  if (folderId === 'images') {
    return files.filter((file) => file.type === 'image');
  }
  if (folderId === 'archives') {
    return files.filter((file) => file.type === 'zip');
  }
  if (folderId === 'shared') {
    return files.filter(
      (file) =>
        file.visibility === 'PUBLIC' ||
        file.visibility === 'SHARED' ||
        file.visibility === 'LINK',
    );
  }
  return files;
}

export function MyFilesDashboard(): React.ReactElement {
  const {
    files,
    isLoading,
    searchQuery,
    selectedFileId,
    setSearchQuery,
    setSelectedFileId,
  } = useVaultFiles();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [fileSort, setFileSort] = useState<FileSort>('modified-desc');
  const viewCopy = getVaultViewCopy('my-files');

  return (
    <VaultChrome
      title={viewCopy.title}
      subtitle={viewCopy.subtitle}
      pageActions={() => <MyFilesUploadAction />}
    >
      <MyFilesDashboardContent
        files={files}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFileId={selectedFileId}
        onSelectFile={(fileId) => setSelectedFileId(fileId)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fileFilter={fileFilter}
        onFileFilterChange={setFileFilter}
        fileSort={fileSort}
        onFileSortChange={setFileSort}
        emptyTitle={viewCopy.emptyTitle}
        emptyMessage={viewCopy.emptyMessage}
      />
    </VaultChrome>
  );
}

type MyFilesDashboardContentProps = {
  files: VaultFile[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fileFilter: FileFilter;
  onFileFilterChange: (filter: FileFilter) => void;
  fileSort: FileSort;
  onFileSortChange: (sort: FileSort) => void;
  emptyTitle: string;
  emptyMessage: string;
};

function MyFilesUploadAction(): React.ReactElement {
  const searchParams = useSearchParams();
  const { folders } = useVaultFolders();
  const { openUploadPanel } = useVaultUpload();
  const folderParam: string | null = searchParams.get('folder');
  const uploadFolderId: string | null = resolveFolderFromQuery(folderParam, folders).uploadFolderId;
  return (
    <Button
      variant="primary"
      className="rounded-xl px-4"
      onClick={() => openUploadPanel({ folderId: uploadFolderId })}
    >
      <UploadCloudIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-8 lg:w-8" />
      Upload
    </Button>
  );
}

function MyFilesDashboardContent({
  files,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedFileId,
  onSelectFile,
  viewMode,
  onViewModeChange,
  fileFilter,
  onFileFilterChange,
  fileSort,
  onFileSortChange,
  emptyTitle,
  emptyMessage,
}: MyFilesDashboardContentProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { folders } = useVaultFolders();
  const folderParam: string | null = searchParams.get('folder');
  const resolvedFolder = useMemo(
    () => resolveFolderFromQuery(folderParam, folders),
    [folderParam, folders],
  );
  const [activeFolderId, setActiveFolderId] = useState<string>(resolvedFolder.filterId);

  useEffect(() => {
    setActiveFolderId(resolvedFolder.filterId);
  }, [resolvedFolder.filterId]);

  function handleFolderSelect(folderId: string): void {
    if(folderId === activeFolderId) {
      setActiveFolderId('all');
       router.replace('/my-files');
       return;
    }
    setActiveFolderId(folderId);
    const queryValue: string = buildFolderQueryValue(folderId, folders);
    if (!queryValue) {
      router.replace('/my-files');
      return;
    }
    router.replace(`/my-files?folder=${encodeURIComponent(queryValue)}`);
  }

  const uploadFolderId: string | null = resolvedFolder.uploadFolderId;
  const filteredFiles = useMemo(() => {
    const folderFiles = filterByFolder(files, activeFolderId);
    const query = searchQuery.trim().toLowerCase();
    const searchedFiles = query
      ? folderFiles.filter((file) => file.name.toLowerCase().includes(query))
      : folderFiles;
    return applyFileSort(applyFileFilter(searchedFiles, fileFilter), fileSort);
  }, [files, activeFolderId, searchQuery, fileFilter, fileSort]);

  return (
    <>
      <FolderCards
        files={files}
        customFolders={folders}
        activeFolderId={activeFolderId}
        onFolderSelect={handleFolderSelect}
      />
      <FileToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        fileFilter={fileFilter}
        onFileFilterChange={onFileFilterChange}
        fileSort={fileSort}
        onFileSortChange={onFileSortChange}
      />
      {isLoading ? (
        <FilesShimmerLoader viewMode={viewMode} />
      ) : viewMode === 'list' ? (
        <MyFilesTable
          files={filteredFiles}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
          uploadFolderId={uploadFolderId}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      ) : (
        <FileGrid
          files={filteredFiles}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
        />
      )}
    </>
  );
}

type MyFilesTableProps = {
  files: readonly VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  uploadFolderId: string | null;
  emptyTitle: string;
  emptyMessage: string;
};

function MyFilesTable({
  files,
  selectedFileId,
  onSelectFile,
  uploadFolderId,
  emptyTitle,
  emptyMessage,
}: MyFilesTableProps): React.ReactElement {
  const { openUploadPanel } = useVaultUpload();
  return (
    <FileTable
      files={files}
      selectedFileId={selectedFileId}
      onSelectFile={onSelectFile}
      onUploadClick={() => openUploadPanel({ folderId: uploadFolderId })}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      showUploadAction
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

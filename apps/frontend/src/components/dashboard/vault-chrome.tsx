'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { StorageSummaryDto } from '@vaultly/shared';
import { CreateFolderDialog } from '@/components/dashboard/create-folder-dialog';
import { DashboardHeader, DashboardPageIntro } from '@/components/dashboard/dashboard-header';
import { FileDetailsPanel } from '@/components/dashboard/file-details-panel';
import { NewActionMenu } from '@/components/dashboard/new-action-menu';
import { Sidebar } from '@/components/dashboard/sidebar';
import { UploadPanel } from '@/components/dashboard/upload-panel';
import { VaultFoldersProvider, useVaultFolders } from '@/hooks/use-vault-folders';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, downloadVaultFile, isUnauthenticatedError } from '@/lib/api-client';
import { forceClientLogout } from '@/lib/auth-session';
import type { VaultFile } from '@/lib/vault-file';

type VaultUploadContextValue = {
  openUploadPanel: (options?: { folderId?: string | null }) => void;
  openNewMenu: () => void;
};

const VaultUploadContext = createContext<VaultUploadContextValue | null>(null);

export function useVaultUpload(): VaultUploadContextValue {
  const context = useContext(VaultUploadContext);
  if (!context) {
    throw new Error('useVaultUpload must be used within VaultChrome.');
  }
  return context;
}

type VaultChromeProps = {
  storage: StorageSummaryDto;
  files: VaultFile[];
  setFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
  setStorage: React.Dispatch<React.SetStateAction<StorageSummaryDto>>;
  isHome?: boolean;
  title?: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFileId: string | null;
  onSelectFile: (fileId: string | null) => void;
  readOnlyFiles?: boolean;
  isTrashView?: boolean;
  pageActions?: () => React.ReactNode;
  children: React.ReactNode;
};

export function VaultChrome({
  storage,
  files,
  setFiles,
  setStorage,
  isHome = false,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  selectedFileId,
  onSelectFile,
  readOnlyFiles = false,
  isTrashView = false,
  pageActions,
  children,
}: VaultChromeProps): React.ReactElement {
  return (
    <VaultFoldersProvider>
      <VaultChromeContent
        storage={storage}
        files={files}
        setFiles={setFiles}
        setStorage={setStorage}
        isHome={isHome}
        title={title}
        subtitle={subtitle}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedFileId={selectedFileId}
        onSelectFile={onSelectFile}
        readOnlyFiles={readOnlyFiles}
        isTrashView={isTrashView}
        pageActions={pageActions}
      >
        {children}
      </VaultChromeContent>
    </VaultFoldersProvider>
  );
}

function VaultChromeContent({
  storage,
  files,
  setFiles,
  setStorage,
  isHome = false,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  selectedFileId,
  onSelectFile,
  readOnlyFiles = false,
  isTrashView = false,
  pageActions,
  children,
}: VaultChromeProps): React.ReactElement {
  const { pushToast } = useToast();
  const { addFolder, reloadFolders } = useVaultFolders();
  const [isNewMenuOpen, setIsNewMenuOpen] = useState<boolean>(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'trash' | 'delete' | 'restore' | null>(null);
  const selectedFile: VaultFile | null = files.find((file) => file.id === selectedFileId) ?? null;
  const uploadContextValue = useMemo<VaultUploadContextValue>(
    () => ({
      openUploadPanel: (options) => {
        setUploadFolderId(options?.folderId ?? null);
        setIsUploadOpen(true);
      },
      openNewMenu: () => setIsNewMenuOpen(true),
    }),
    [],
  );

  async function handleDeleteFile(fileId: string): Promise<void> {
    const isPermanent: boolean = isTrashView;
    setPendingAction(isPermanent ? 'delete' : 'trash');
    try {
      const suffix: string = isPermanent ? '?permanent=1' : '';
      const result = await apiRequest<{ ok: true; storage: StorageSummaryDto }>(
        `/api/files/${fileId}${suffix}`,
        { method: 'DELETE' },
      );
      setFiles((current) => current.filter((file) => file.id !== fileId));
      setStorage(result.storage);
      onSelectFile(null);
      setIsShareOpen(false);
      void reloadFolders();
      pushToast({
        tone: 'success',
        title: isPermanent ? 'File deleted forever' : 'Moved to trash',
        message: isPermanent
          ? 'The file was permanently removed from Vaultly.'
          : 'You can restore it from Trash.',
      });
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        pushToast({
          tone: 'error',
          title: 'Session expired',
          message: 'Please sign in again to continue.',
        });
        forceClientLogout('/');
        return;
      }
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: isPermanent
          ? 'Could not delete the file. Please try again.'
          : 'Could not move the file to trash. Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRestoreFile(fileId: string): Promise<void> {
    setPendingAction('restore');
    try {
      const result = await apiRequest<{ ok: true; storage: StorageSummaryDto }>(
        `/api/files/${fileId}/restore`,
        { method: 'POST' },
      );
      setFiles((current) => current.filter((file) => file.id !== fileId));
      setStorage(result.storage);
      onSelectFile(null);
      void reloadFolders();
      pushToast({
        tone: 'success',
        title: 'File restored',
        message: 'The file is back in your vault.',
      });
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        pushToast({
          tone: 'error',
          title: 'Session expired',
          message: 'Please sign in again to continue.',
        });
        forceClientLogout('/');
        return;
      }
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: 'Could not restore the file. Please try again.',
      });
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy: boolean = pendingAction !== null;
  const pendingCopy =
    pendingAction === 'restore'
      ? { title: 'Restoring file...', subtitle: 'Putting it back in your vault.' }
      : pendingAction === 'delete'
        ? { title: 'Deleting forever...', subtitle: 'This cannot be undone.' }
        : { title: 'Moving to trash...', subtitle: 'You can restore it later.' };

  return (
    <VaultUploadContext.Provider value={uploadContextValue}>
      <div className="flex h-screen overflow-hidden bg-gray-50 text-vaultly-ink">
        <Sidebar storage={storage} onNewClick={() => setIsNewMenuOpen(true)} />
        <div className="relative flex min-w-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col ">
            <DashboardHeader
              files={files}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onSelectFile={onSelectFile}
            />
            <div className="flex-1 overflow-y-auto px-6 py-6 xl:px-8">
              <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <DashboardPageIntro
                  isHome={isHome}
                  title={title}
                  subtitle={subtitle}
                  actions={pageActions?.()}
                />
                {children}
              </div>
            </div>
          </main>
          <UploadPanel
            isOpen={isUploadOpen}
            onClose={() => {
              setIsUploadOpen(false);
              setUploadFolderId(null);
            }}
            targetFolderId={uploadFolderId}
            onUploaded={(file, nextStorage) => {
              setFiles((current) => [file, ...current.filter((item) => item.id !== file.id)]);
              setStorage(nextStorage);
              void reloadFolders();
            }}
          />
          <NewActionMenu
            isOpen={isNewMenuOpen}
            onClose={() => setIsNewMenuOpen(false)}
            onUploadFile={() => setIsUploadOpen(true)}
            onCreateFolder={() => setIsCreateFolderOpen(true)}
          />
          <CreateFolderDialog
            isOpen={isCreateFolderOpen}
            onClose={() => setIsCreateFolderOpen(false)}
            onCreated={addFolder}
          />
        </div>
        <FileDetailsPanel
          file={selectedFile}
          isOpen={selectedFileId !== null}
          isShareOpen={isShareOpen}
          isDeleting={isBusy}
          isTrashView={isTrashView}
          readOnly={readOnlyFiles}
          onClose={() => {
            if (isBusy) {
              return;
            }
            onSelectFile(null);
            setIsShareOpen(false);
          }}
          onToggleShare={() => setIsShareOpen((current) => !current)}
          onCloseShare={() => setIsShareOpen(false)}
          onDownload={() => {
            if (!selectedFile || isBusy) {
              return;
            }
            void downloadVaultFile(selectedFile.id, selectedFile.name).catch(() => {
              pushToast({
                tone: 'error',
                message: 'Could not download the file. Please try again.',
              });
            });
          }}
          onRestore={() => {
            if (!selectedFile || isBusy) {
              return;
            }
            void handleRestoreFile(selectedFile.id);
          }}
          onDelete={() => {
            if (!selectedFile || isBusy) {
              return;
            }
            void handleDeleteFile(selectedFile.id);
          }}
        />
        {isBusy ? (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-label={pendingCopy.title}
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-vaultly-ink" />
              <p className="text-sm font-semibold text-vaultly-ink">{pendingCopy.title}</p>
              <p className="text-xs text-vaultly-muted">{pendingCopy.subtitle}</p>
            </div>
          </div>
        ) : null}
      </div>
    </VaultUploadContext.Provider>
  );
}

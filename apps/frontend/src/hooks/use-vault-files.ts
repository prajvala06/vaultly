'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ListFilesResponse, ListSharedWithMeResponse, StorageSummaryDto } from '@vaultly/shared';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, isUnauthenticatedError } from '@/lib/api-client';
import { forceClientLogout, readAuthSession } from '@/lib/auth-session';
import { useVaultStore } from '@/stores/vault-store';
import type { VaultFile } from '@/lib/vault-file';

export type VaultFilesScope = 'owned' | 'shared-with-me' | 'trash';

type UseVaultFilesResult = {
  files: VaultFile[];
  storage: StorageSummaryDto;
  isLoading: boolean;
  searchQuery: string;
  selectedFileId: string | null;
  setFiles: (update: VaultFile[] | ((current: VaultFile[]) => VaultFile[])) => void;
  setStorage: (
    update: StorageSummaryDto | ((current: StorageSummaryDto) => StorageSummaryDto),
  ) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSelectedFileId: (selectedFileId: string | null) => void;
  reloadFiles: () => Promise<void>;
};

export function useVaultFiles(scope: VaultFilesScope = 'owned'): UseVaultFilesResult {
  const router = useRouter();
  const { pushToast } = useToast();
  const files = useVaultStore((state) => state.files);
  const storage = useVaultStore((state) => state.storage);
  const isLoading = useVaultStore((state) => state.isLoading);
  const searchQuery = useVaultStore((state) => state.searchQuery);
  const selectedFileId = useVaultStore((state) => state.selectedFileId);
  const setFiles = useVaultStore((state) => state.setFiles);
  const setStorage = useVaultStore((state) => state.setStorage);
  const setIsLoading = useVaultStore((state) => state.setIsLoading);
  const setSearchQuery = useVaultStore((state) => state.setSearchQuery);
  const setSelectedFileId = useVaultStore((state) => state.setSelectedFileId);
  const replaceVaultData = useVaultStore((state) => state.replaceVaultData);
  const resetVaultUi = useVaultStore((state) => state.resetVaultUi);

  const reloadFiles = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (scope === 'shared-with-me') {
        const [sharedResult, ownedResult] = await Promise.all([
          apiRequest<ListSharedWithMeResponse>('/api/files/shared-with-me'),
          apiRequest<ListFilesResponse>('/api/files'),
        ]);
        replaceVaultData({
          files: sharedResult.files,
          storage: ownedResult.storage,
        });
        return;
      }
      const filesPath: string = scope === 'trash' ? '/api/files?trashed=1' : '/api/files';
      const result = await apiRequest<ListFilesResponse>(filesPath);
      replaceVaultData({
        files: result.files,
        storage: result.storage,
      });
    } catch (error) {
      setIsLoading(false);
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
        message: 'Could not load your files. Is the API running?',
      });
    }
  }, [pushToast, replaceVaultData, scope, setIsLoading]);

  useEffect(() => {
    resetVaultUi();
    if (!readAuthSession()) {
      router.replace('/');
      return;
    }
    void reloadFiles();
  }, [reloadFiles, resetVaultUi, router]);

  return {
    files,
    storage,
    isLoading,
    searchQuery,
    selectedFileId,
    setFiles,
    setStorage,
    setSearchQuery,
    setSelectedFileId,
    reloadFiles,
  };
}

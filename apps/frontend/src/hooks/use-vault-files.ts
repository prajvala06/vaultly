'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ListFilesResponse, ListSharedWithMeResponse, StorageSummaryDto } from '@vaultly/shared';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, isUnauthenticatedError } from '@/lib/api-client';
import { forceClientLogout, readAuthSession } from '@/lib/auth-session';
import { EMPTY_STORAGE_SUMMARY, type VaultFile } from '@/lib/vault-file';

export type VaultFilesScope = 'owned' | 'shared-with-me' | 'trash';

type UseVaultFilesResult = {
  files: VaultFile[];
  storage: StorageSummaryDto;
  isLoading: boolean;
  setFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
  setStorage: React.Dispatch<React.SetStateAction<StorageSummaryDto>>;
  reloadFiles: () => Promise<void>;
};

export function useVaultFiles(scope: VaultFilesScope = 'owned'): UseVaultFilesResult {
  const router = useRouter();
  const { pushToast } = useToast();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [storage, setStorage] = useState<StorageSummaryDto>(EMPTY_STORAGE_SUMMARY);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadFiles = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (scope === 'shared-with-me') {
        const [sharedResult, ownedResult] = await Promise.all([
          apiRequest<ListSharedWithMeResponse>('/api/files/shared-with-me'),
          apiRequest<ListFilesResponse>('/api/files'),
        ]);
        setFiles(sharedResult.files);
        setStorage(ownedResult.storage);
        return;
      }
      const filesPath: string = scope === 'trash' ? '/api/files?trashed=1' : '/api/files';
      const result = await apiRequest<ListFilesResponse>(filesPath);
      setFiles(result.files);
      setStorage(result.storage);
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
      } else {
        pushToast({
          tone: 'error',
          message: 'Could not load your files. Is the API running?',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [pushToast, scope]);

  useEffect(() => {
    if (!readAuthSession()) {
      router.replace('/');
      return;
    }
    void reloadFiles();
  }, [reloadFiles, router]);

  return {
    files,
    storage,
    isLoading,
    setFiles,
    setStorage,
    reloadFiles,
  };
}

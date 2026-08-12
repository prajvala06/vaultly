'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { VaultFolderDto } from '@vaultly/shared';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, isUnauthenticatedError } from '@/lib/api-client';
import { readAuthSession } from '@/lib/auth-session';

type ListFoldersResponse = {
  folders: VaultFolderDto[];
};

type VaultFoldersContextValue = {
  folders: VaultFolderDto[];
  reloadFolders: () => Promise<void>;
  addFolder: (folder: VaultFolderDto) => void;
};

const VaultFoldersContext = createContext<VaultFoldersContextValue | null>(null);

export function VaultFoldersProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { pushToast } = useToast();
  const [folders, setFolders] = useState<VaultFolderDto[]>([]);

  const reloadFolders = useCallback(async (): Promise<void> => {
    if (!readAuthSession()) {
      return;
    }
    try {
      const result = await apiRequest<ListFoldersResponse>('/api/folders');
      setFolders(result.folders);
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        return;
      }
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({
        tone: 'error',
        message: 'Could not load folders. Is the API running?',
      });
    }
  }, [pushToast]);

  const addFolder = useCallback((folder: VaultFolderDto): void => {
    setFolders((current) => [folder, ...current.filter((item) => item.id !== folder.id)]);
  }, []);

  useEffect(() => {
    void reloadFolders();
  }, [reloadFolders]);

  const value = useMemo<VaultFoldersContextValue>(
    () => ({
      folders,
      reloadFolders,
      addFolder,
    }),
    [addFolder, folders, reloadFolders],
  );

  return <VaultFoldersContext.Provider value={value}>{children}</VaultFoldersContext.Provider>;
}

export function useVaultFolders(): VaultFoldersContextValue {
  const context = useContext(VaultFoldersContext);
  if (!context) {
    throw new Error('useVaultFolders must be used within VaultFoldersProvider.');
  }
  return context;
}

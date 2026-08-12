'use client';

import { useState } from 'react';
import { StorageCards } from '@/components/dashboard/storage-cards';
import { StorageDonut } from '@/components/dashboard/storage-donut';
import { VaultChrome } from '@/components/dashboard/vault-chrome';
import { useVaultFiles } from '@/hooks/use-vault-files';

export function HomeDashboard(): React.ReactElement {
  const { files, storage, setFiles, setStorage } = useVaultFiles();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  return (
    <VaultChrome
      isHome
      storage={storage}
      files={files}
      setFiles={setFiles}
      setStorage={setStorage}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedFileId={selectedFileId}
      onSelectFile={setSelectedFileId}
    >
      <StorageCards files={files} storage={storage} />
      <StorageDonut files={files} storage={storage} />
    </VaultChrome>
  );
}

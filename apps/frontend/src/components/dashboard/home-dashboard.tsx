'use client';

import { StorageCards } from '@/components/dashboard/storage-cards';
import { StorageDonut } from '@/components/dashboard/storage-donut';
import { VaultChrome } from '@/components/dashboard/vault-chrome';
import { HomeShimmerLoader } from '@/components/ui/shimmer';
import { useVaultFiles } from '@/hooks/use-vault-files';

export function HomeDashboard(): React.ReactElement {
  const { files, storage, isLoading } = useVaultFiles();

  return (
    <VaultChrome isHome>
      {isLoading ? (
        <HomeShimmerLoader />
      ) : (
        <>
          <StorageCards files={files} storage={storage} />
          <StorageDonut files={files} storage={storage} />
        </>
      )}
    </VaultChrome>
  );
}

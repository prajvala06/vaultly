import type { VaultFile } from '@/lib/vault-file';

export type VaultView =
  | 'home'
  | 'my-vault'
  | 'recent'
  | 'shared-with-me'
  | 'starred'
  | 'trash';

export type VaultViewCopy = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyMessage: string;
};

const RECENT_DAYS = 7;

export function getVaultViewCopy(view: VaultView, folderName?: string | null): VaultViewCopy {
  if (view === 'home') {
    return {
      title: 'Welcome back',
      subtitle: 'Pick up where you left off',
      emptyTitle: 'No files yet',
      emptyMessage: 'Upload your first file to get started.',
    };
  }
  if (view === 'recent') {
    return {
      title: 'Recent files',
      subtitle: 'Files updated in the last 7 days',
      emptyTitle: 'No recent files',
      emptyMessage: 'Files you upload or update will show up here.',
    };
  }
  if (view === 'shared-with-me') {
    return {
      title: 'Shared with me',
      subtitle: 'Files and folders shared by others',
      emptyTitle: 'Nothing shared yet',
      emptyMessage: 'Files shared with you will appear here.',
    };
  }
  if (view === 'starred') {
    return {
      title: 'Starred files',
      subtitle: 'Quick access to your favorites',
      emptyTitle: 'No starred files',
      emptyMessage: 'Star files to keep them here for quick access.',
    };
  }
  if (view === 'trash') {
    return {
      title: 'Trash',
      subtitle: 'Deleted files will appear here',
      emptyTitle: 'Trash is empty',
      emptyMessage: 'Deleted files will stay here until you remove them forever.',
    };
  }
  if (view === 'my-vault') {
    const title = folderName ? folderName.charAt(0).toUpperCase() + folderName.slice(1) : 'My Vault';
    return {
      title,
      subtitle: folderName ? `Files in ${title}` : 'Everything stored in your vault',
      emptyTitle: 'No files yet',
      emptyMessage: folderName ? `Upload your first file to ${title}.` : 'Upload your first file to get started.',
    };
  }
  return {
    title: 'Recent files',
    subtitle: 'Your latest uploads and updates',
    emptyTitle: 'No files yet',
    emptyMessage: 'Upload your first file to get started.',
  };
}

export function filterFilesByVaultView(
  files: readonly VaultFile[],
  view: VaultView,
): readonly VaultFile[] {
  if (view === 'shared-with-me' || view === 'trash') {
    return files;
  }
  if (view === 'recent') {
    const cutoffMs: number = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    return files.filter((file) => {
      const updatedAtMs: number = Date.parse(file.updatedAtIso);
      if (Number.isNaN(updatedAtMs)) {
        return true;
      }
      return updatedAtMs >= cutoffMs;
    });
  }
  if (view === 'starred') {
    return [];
  }
  return files;
}

export function shouldShowStorageCards(view: VaultView): boolean {
  return view === 'home';
}

export function shouldShowFolderCards(view: VaultView): boolean {
  return view === 'my-vault';
}

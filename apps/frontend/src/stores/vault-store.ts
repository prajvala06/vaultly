import type { StorageSummaryDto } from '@vaultly/shared';
import { create } from 'zustand';
import { EMPTY_STORAGE_SUMMARY, type VaultFile } from '@/lib/vault-file';

type SetStateAction<T> = T | ((current: T) => T);

function applyUpdate<T>(current: T, update: SetStateAction<T>): T {
  if (typeof update === 'function') {
    return (update as (current: T) => T)(current);
  }
  return update;
}

export type VaultStoreState = {
  files: VaultFile[];
  storage: StorageSummaryDto;
  isLoading: boolean;
  searchQuery: string;
  selectedFileId: string | null;
  setFiles: (update: SetStateAction<VaultFile[]>) => void;
  setStorage: (update: SetStateAction<StorageSummaryDto>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSelectedFileId: (selectedFileId: string | null) => void;
  replaceVaultData: (input: { files: VaultFile[]; storage: StorageSummaryDto }) => void;
  resetVaultUi: () => void;
};

export const useVaultStore = create<VaultStoreState>((set) => ({
  files: [],
  storage: EMPTY_STORAGE_SUMMARY,
  isLoading: true,
  searchQuery: '',
  selectedFileId: null,
  setFiles: (update) => {
    set((state) => ({ files: applyUpdate(state.files, update) }));
  },
  setStorage: (update) => {
    set((state) => ({ storage: applyUpdate(state.storage, update) }));
  },
  setIsLoading: (isLoading) => {
    set({ isLoading });
  },
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },
  setSelectedFileId: (selectedFileId) => {
    set({ selectedFileId });
  },
  replaceVaultData: ({ files, storage }) => {
    set({ files, storage, isLoading: false });
  },
  resetVaultUi: () => {
    set({ searchQuery: '', selectedFileId: null, isLoading: true });
  },
}));

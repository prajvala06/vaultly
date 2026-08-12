import type { FileType, FileVisibility, StorageSummaryDto, VaultFileDto } from '@vaultly/shared';

export type { FileType, FileVisibility, StorageSummaryDto, VaultFileDto as VaultFile };

export const EMPTY_STORAGE_SUMMARY: StorageSummaryDto = {
  usedBytes: 0,
  quotaBytes: 1 * 1024 * 1024 * 1024,
  usedLabel: '0 B',
  quotaLabel: '1 GB',
  usedPercent: 0,
  fileCount: 0,
  sharedCount: 0,
};

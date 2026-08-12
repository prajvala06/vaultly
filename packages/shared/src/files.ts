export type FileVisibility = 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';

export type FileType = 'pdf' | 'zip' | 'image' | 'doc' | 'other';

export type VaultFileDto = {
  id: string;
  name: string;
  owner: string;
  sizeLabel: string;
  sizeBytes: number;
  visibility: FileVisibility;
  modifiedLabel: string;
  uploadedAt: string;
  modifiedAt: string;
  createdAtIso: string;
  updatedAtIso: string;
  type: FileType;
  mimeLabel: string;
  folderId?: string | null;
  isTrashed?: boolean;
};

export type SharedFileDto = {
  id: string;
  name: string;
  owner: string;
  sizeLabel: string;
  mimeLabel: string;
  type: FileType;
  visibility: FileVisibility;
};

export type StorageSummaryDto = {
  usedBytes: number;
  quotaBytes: number;
  usedLabel: string;
  quotaLabel: string;
  usedPercent: number;
  fileCount: number;
  sharedCount: number;
};

export type ListFilesResponse = {
  files: VaultFileDto[];
  storage: StorageSummaryDto;
};

export type ListSharedWithMeResponse = {
  files: VaultFileDto[];
};

export type UploadFileResponse = {
  file: VaultFileDto;
  storage: StorageSummaryDto;
};

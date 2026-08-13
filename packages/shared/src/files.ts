import { z } from 'zod';

export type FileVisibility = 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';

export const FILE_VISIBILITY_VALUES = ['PRIVATE', 'LINK', 'SHARED', 'PUBLIC'] as const;

export const updateFileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a file name.')
      .max(255, 'File name must be at most 255 characters.')
      .regex(/^[^\\/:*?"<>|]+$/, 'File name contains invalid characters.')
      .optional(),
    visibility: z.enum(FILE_VISIBILITY_VALUES).optional(),
  })
  .refine((data) => data.name !== undefined || data.visibility !== undefined, {
    message: 'Provide a name or visibility to update.',
  });

export type UpdateFileInput = z.infer<typeof updateFileSchema>;

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

export type UpdateFileResponse = {
  file: VaultFileDto;
  storage: StorageSummaryDto;
};

export type FileShareDto = {
  userId: string;
  name: string;
  email: string;
};

export type ListFileSharesResponse = {
  shares: FileShareDto[];
};

import type { File as DbFile, FileVisibility as DbVisibility, User } from '@prisma/client';
import type {
  FileType,
  FileVisibility,
  SharedFileDto,
  StorageSummaryDto,
  VaultFileDto,
} from '@vaultly/shared';
import { env } from '../config/env.js';

type FileWithOwner = DbFile & {
  user: Pick<User, 'name'>;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units: readonly string[] = ['KB', 'MB', 'GB', 'TB'];
  let value: number = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded: string = value >= 10 || unitIndex <= 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeDay(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays: number = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return formatDisplayDate(date);
}

export function resolveFileType(mimeType: string, fileName: string): FileType {
  const lowerName: string = fileName.toLowerCase();
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(lowerName)) {
    return 'image';
  }
  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    /\.(zip|rar|7z|tar|gz)$/.test(lowerName)
  ) {
    return 'zip';
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    /\.(docx?|txt|rtf|md)$/.test(lowerName)
  ) {
    return 'doc';
  }
  return 'other';
}

export function resolveMimeLabel(mimeType: string, type: FileType): string {
  if (type === 'pdf') {
    return 'PDF Document';
  }
  if (type === 'zip') {
    return 'ZIP Archive';
  }
  if (type === 'image') {
    return 'Image';
  }
  if (type === 'doc') {
    return 'Document';
  }
  return mimeType || 'File';
}

export function mapFileToDto(file: FileWithOwner): VaultFileDto {
  const type: FileType = resolveFileType(file.mimeType, file.originalName);
  const visibility: FileVisibility = file.visibility as DbVisibility;
  return {
    id: file.id,
    name: file.originalName,
    owner: file.user.name,
    sizeLabel: formatBytes(file.bytes),
    sizeBytes: file.bytes,
    visibility,
    modifiedLabel: formatRelativeDay(file.updatedAt),
    uploadedAt: formatDisplayDate(file.createdAt),
    modifiedAt: formatDisplayDate(file.updatedAt),
    createdAtIso: file.createdAt.toISOString(),
    updatedAtIso: file.updatedAt.toISOString(),
    type,
    mimeLabel: resolveMimeLabel(file.mimeType, type),
    folderId: file.folderId ?? null,
    isTrashed: file.deletedAt !== null,
  };
}

export function mapFileToSharedDto(file: FileWithOwner): SharedFileDto {
  const type: FileType = resolveFileType(file.mimeType, file.originalName);
  const visibility: FileVisibility = file.visibility as DbVisibility;
  return {
    id: file.id,
    name: file.originalName,
    owner: file.user.name,
    sizeLabel: formatBytes(file.bytes),
    mimeLabel: resolveMimeLabel(file.mimeType, type),
    type,
    visibility,
  };
}

export function buildStorageSummary(input: {
  usedBytes: number;
  fileCount: number;
  sharedCount: number;
}): StorageSummaryDto {
  const quotaBytes: number = env.storageQuotaBytes;
  const usedPercent: number =
    quotaBytes <= 0 ? 0 : Math.min(100, Math.round((input.usedBytes / quotaBytes) * 100));
  return {
    usedBytes: input.usedBytes,
    quotaBytes,
    usedLabel: formatBytes(input.usedBytes),
    quotaLabel: formatBytes(quotaBytes),
    usedPercent,
    fileCount: input.fileCount,
    sharedCount: input.sharedCount,
  };
}

export { formatBytes };

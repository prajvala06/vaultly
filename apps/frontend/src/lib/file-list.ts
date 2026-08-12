import type { FileType, FileVisibility, VaultFile } from '@/lib/vault-file';

export type FileFilter = 'all' | FileType | FileVisibility;

export type FileSort =
  | 'modified-desc'
  | 'uploaded-desc'
  | 'name-asc'
  | 'name-desc'
  | 'size-desc'
  | 'size-asc';

export const FILE_FILTER_OPTIONS: readonly { value: FileFilter; label: string }[] = [
  { value: 'all', label: 'All files' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'image', label: 'Images' },
  { value: 'doc', label: 'Documents' },
  { value: 'zip', label: 'Archives' },
  { value: 'other', label: 'Other' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'SHARED', label: 'Shared' },
  { value: 'LINK', label: 'Link' },
  { value: 'PUBLIC', label: 'Public' },
];

export const FILE_SORT_OPTIONS: readonly { value: FileSort; label: string }[] = [
  { value: 'modified-desc', label: 'Last modified' },
  { value: 'uploaded-desc', label: 'Date uploaded' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'size-desc', label: 'Largest' },
  { value: 'size-asc', label: 'Smallest' },
];

export function getFileFilterLabel(filter: FileFilter): string {
  return FILE_FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? 'All files';
}

export function getFileSortLabel(sort: FileSort): string {
  return FILE_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Last modified';
}

export function applyFileFilter(
  files: readonly VaultFile[],
  filter: FileFilter,
): readonly VaultFile[] {
  if (filter === 'all') {
    return files;
  }
  if (filter === 'PRIVATE' || filter === 'SHARED' || filter === 'LINK' || filter === 'PUBLIC') {
    return files.filter((file) => file.visibility === filter);
  }
  return files.filter((file) => file.type === filter);
}

export function applyFileSort(files: readonly VaultFile[], sort: FileSort): VaultFile[] {
  const nextFiles: VaultFile[] = [...files];
  nextFiles.sort((left, right) => {
    if (sort === 'name-asc') {
      return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
    }
    if (sort === 'name-desc') {
      return right.name.localeCompare(left.name, undefined, { sensitivity: 'base' });
    }
    if (sort === 'size-desc') {
      return right.sizeBytes - left.sizeBytes;
    }
    if (sort === 'size-asc') {
      return left.sizeBytes - right.sizeBytes;
    }
    if (sort === 'uploaded-desc') {
      return Date.parse(right.createdAtIso) - Date.parse(left.createdAtIso);
    }
    return Date.parse(right.updatedAtIso) - Date.parse(left.updatedAtIso);
  });
  return nextFiles;
}

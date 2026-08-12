import type { VaultFolderDto } from '@vaultly/shared';

export const SYSTEM_FOLDER_IDS: readonly string[] = [
  'documents',
  'images',
  'archives',
  'shared',
] as const;

export type ResolvedFolderSelection = {
  filterId: string;
  uploadFolderId: string | null;
  queryValue: string | null;
};

export function isSystemFolderId(folderId: string): boolean {
  return SYSTEM_FOLDER_IDS.includes(folderId);
}

export function buildFolderQueryValue(
  folderId: string,
  customFolders: readonly VaultFolderDto[],
): string {
  if (folderId === 'all') {
    return '';
  }
  if (isSystemFolderId(folderId)) {
    return folderId;
  }
  const customFolder: VaultFolderDto | undefined = customFolders.find(
    (folder) => folder.id === folderId,
  );
  return customFolder ? customFolder.name : folderId;
}

export function resolveFolderFromQuery(
  folderParam: string | null,
  customFolders: readonly VaultFolderDto[],
): ResolvedFolderSelection {
  if (!folderParam) {
    return {
      filterId: 'all',
      uploadFolderId: null,
      queryValue: null,
    };
  }
  const decodedParam: string = decodeURIComponent(folderParam).trim();
  if (isSystemFolderId(decodedParam)) {
    return {
      filterId: decodedParam,
      uploadFolderId: null,
      queryValue: decodedParam,
    };
  }
  const customByName: VaultFolderDto | undefined = customFolders.find(
    (folder) => folder.name.toLowerCase() === decodedParam.toLowerCase(),
  );
  if (customByName) {
    return {
      filterId: customByName.id,
      uploadFolderId: customByName.id,
      queryValue: customByName.name,
    };
  }
  const customById: VaultFolderDto | undefined = customFolders.find(
    (folder) => folder.id === decodedParam,
  );
  if (customById) {
    return {
      filterId: customById.id,
      uploadFolderId: customById.id,
      queryValue: customById.name,
    };
  }
  return {
    filterId: 'all',
    uploadFolderId: null,
    queryValue: null,
  };
}

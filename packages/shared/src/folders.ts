export type VaultFolderDto = {
  id: string;
  name: string;
  fileCount: number;
  createdAtIso: string;
};

export type ListFoldersResponse = {
  folders: VaultFolderDto[];
};

export type CreateFolderResponse = {
  folder: VaultFolderDto;
};

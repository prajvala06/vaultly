export type VaultFolderDto = {
  id: string;
  name: string;
  owner: string;
  fileCount: number;
  modifiedLabel: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type ListFoldersResponse = {
  folders: VaultFolderDto[];
};

export type CreateFolderResponse = {
  folder: VaultFolderDto;
};

export type DeleteFolderResponse = {
  folderId: string;
};

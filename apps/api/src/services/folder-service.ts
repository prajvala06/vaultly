import type { CreateFolderResponse, ListFoldersResponse, VaultFolderDto } from '@vaultly/shared';
import { HttpError } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';

const activeFilesCount = {
  select: {
    files: {
      where: { deletedAt: null },
    },
  },
} as const;

function mapFolderToDto(input: {
  id: string;
  name: string;
  createdAt: Date;
  _count: { files: number };
}): VaultFolderDto {
  return {
    id: input.id,
    name: input.name,
    fileCount: input._count.files,
    createdAtIso: input.createdAt.toISOString(),
  };
}

export async function listUserFolders(userId: string): Promise<ListFoldersResponse> {
  const folders = await prisma.folder.findMany({
    where: { userId },
    include: {
      _count: activeFilesCount,
    },
    orderBy: { createdAt: 'desc' },
  });
  return {
    folders: folders.map((folder) => mapFolderToDto(folder)),
  };
}

export async function createUserFolder(input: {
  userId: string;
  name: string;
}): Promise<CreateFolderResponse> {
  const name: string = input.name.trim();
  if (!name) {
    throw new HttpError(400, 'FOLDER_NAME_REQUIRED', 'Enter a folder name.');
  }
  if (name.length > 100) {
    throw new HttpError(400, 'FOLDER_NAME_TOO_LONG', 'Folder name must be 100 characters or fewer.');
  }
  const existing = await prisma.folder.findUnique({
    where: {
      userId_name: {
        userId: input.userId,
        name,
      },
    },
  });
  if (existing) {
    throw new HttpError(409, 'FOLDER_EXISTS', 'A folder with this name already exists.');
  }
  const created = await prisma.folder.create({
    data: {
      userId: input.userId,
      name,
    },
    include: {
      _count: activeFilesCount,
    },
  });
  return {
    folder: mapFolderToDto(created),
  };
}

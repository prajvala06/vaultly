import type {
  CreateFolderResponse,
  DeleteFolderResponse,
  ListFoldersResponse,
  VaultFolderDto,
} from '@vaultly/shared';
import { HttpError } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { formatRelativeDay } from './file-mapper.js';

const folderListInclude = {
  user: {
    select: { name: true },
  },
  _count: {
    select: {
      files: {
        where: { deletedAt: null },
      },
    },
  },
} as const;

function mapFolderToDto(input: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string };
  _count: { files: number };
}): VaultFolderDto {
  return {
    id: input.id,
    name: input.name,
    owner: input.user.name,
    fileCount: input._count.files,
    modifiedLabel: formatRelativeDay(input.updatedAt),
    createdAtIso: input.createdAt.toISOString(),
    updatedAtIso: input.updatedAt.toISOString(),
  };
}

export async function listUserFolders(userId: string): Promise<ListFoldersResponse> {
  const folders = await prisma.folder.findMany({
    where: { userId },
    include: folderListInclude,
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
    include: folderListInclude,
  });
  return {
    folder: mapFolderToDto(created),
  };
}

export async function deleteUserFolder(input: {
  userId: string;
  folderId: string;
}): Promise<DeleteFolderResponse> {
  const folder = await prisma.folder.findFirst({
    where: {
      id: input.folderId,
      userId: input.userId,
    },
  });
  if (!folder) {
    throw new HttpError(404, 'FOLDER_NOT_FOUND', 'Folder not found.');
  }
  await prisma.folder.delete({
    where: { id: folder.id },
  });
  return {
    folderId: folder.id,
  };
}

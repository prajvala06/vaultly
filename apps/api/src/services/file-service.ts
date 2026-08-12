import type { File as DbFile } from '@prisma/client';
import type {
  FileVisibility,
  ListFilesResponse,
  ListSharedWithMeResponse,
  SharedFileDto,
  UpdateFileResponse,
  UploadFileResponse,
  VaultFileDto,
} from '@vaultly/shared';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import {
  deleteCloudinaryAsset,
  fetchCloudinaryAsset,
  uploadBufferToCloudinary,
} from './cloudinary-service.js';
import { buildStorageSummary, mapFileToDto, mapFileToSharedDto } from './file-mapper.js';

type UploadedMulterFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

async function getStorageStats(userId: string): Promise<{
  usedBytes: number;
  fileCount: number;
  sharedCount: number;
}> {
  const [aggregate, fileCount, sharedCount] = await Promise.all([
    prisma.file.aggregate({
      where: { userId },
      _sum: { bytes: true },
    }),
    prisma.file.count({ where: { userId, deletedAt: null } }),
    prisma.file.count({
      where: { userId, deletedAt: null, visibility: { in: ['PUBLIC', 'SHARED', 'LINK'] } },
    }),
  ]);
  return {
    usedBytes: aggregate._sum.bytes ?? 0,
    fileCount,
    sharedCount,
  };
}

async function getStorageSummaryForUser(userId: string) {
  const stats = await getStorageStats(userId);
  return buildStorageSummary(stats);
}

export async function listUserFiles(
  userId: string,
  options: { trashed?: boolean } = {},
): Promise<ListFilesResponse> {
  const files = await prisma.file.findMany({
    where: {
      userId,
      deletedAt: options.trashed ? { not: null } : null,
    },
    include: {
      user: {
        select: { name: true },
      },
    },
    orderBy: options.trashed ? { deletedAt: 'desc' } : { createdAt: 'desc' },
  });
  const storage = await getStorageSummaryForUser(userId);
  return {
    files: files.map((file) => mapFileToDto(file)),
    storage,
  };
}

export async function listFilesSharedWithUser(userId: string): Promise<ListSharedWithMeResponse> {
  const shares = await prisma.fileShare.findMany({
    where: {
      userId,
      file: {
        deletedAt: null,
      },
    },
    include: {
      file: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return {
    files: shares.map((share) => mapFileToDto(share.file)),
  };
}

export async function shareFileWithUser(input: {
  ownerId: string;
  fileId: string;
  email: string;
}): Promise<{ ok: true }> {
  const normalizedEmail: string = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(400, 'EMAIL_REQUIRED', 'Enter an email address to share with.');
  }
  const file = await prisma.file.findFirst({
    where: {
      id: input.fileId,
      userId: input.ownerId,
      deletedAt: null,
    },
  });
  if (!file) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  const recipient = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!recipient) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'No Vaultly account exists for that email.');
  }
  if (recipient.id === input.ownerId) {
    throw new HttpError(400, 'INVALID_SHARE_TARGET', 'You cannot share a file with yourself.');
  }
  await prisma.$transaction([
    prisma.fileShare.upsert({
      where: {
        fileId_userId: {
          fileId: file.id,
          userId: recipient.id,
        },
      },
      create: {
        fileId: file.id,
        userId: recipient.id,
      },
      update: {},
    }),
    prisma.file.update({
      where: { id: file.id },
      data: {
        visibility: file.visibility === 'PRIVATE' ? 'SHARED' : file.visibility,
      },
    }),
  ]);
  return { ok: true };
}

export async function uploadUserFile(input: {
  userId: string;
  file: UploadedMulterFile;
  visibility?: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';
  folderId?: string | null;
}): Promise<UploadFileResponse> {
  if (!input.file) {
    throw new HttpError(400, 'FILE_REQUIRED', 'Choose a file to upload.');
  }
  if (input.file.size <= 0) {
    throw new HttpError(400, 'FILE_EMPTY', 'The selected file is empty.');
  }
  if (input.file.size > env.maxFileSizeBytes) {
    throw new HttpError(
      400,
      'FILE_TOO_LARGE',
      `File exceeds the maximum size of ${Math.round(env.maxFileSizeBytes / (1024 * 1024))} MB.`,
    );
  }
  const visibility: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC' =
    input.visibility === 'PUBLIC'
      ? 'PUBLIC'
      : input.visibility === 'SHARED'
        ? 'SHARED'
        : input.visibility === 'LINK'
          ? 'LINK'
          : 'PRIVATE';
  const stats = await getStorageStats(input.userId);
  if (stats.usedBytes + input.file.size > env.storageQuotaBytes) {
    throw new HttpError(400, 'QUOTA_EXCEEDED', 'Not enough storage space for this upload.');
  }
  let resolvedFolderId: string | null = null;
  if (input.folderId) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: input.folderId,
        userId: input.userId,
      },
    });
    if (!folder) {
      throw new HttpError(404, 'FOLDER_NOT_FOUND', 'Folder not found.');
    }
    resolvedFolderId = folder.id;
  }
  const cloudinaryFolder: string = `${env.cloudinaryFolder}/${input.userId}`;
  let uploaded;
  try {
    uploaded = await uploadBufferToCloudinary({
      buffer: input.file.buffer,
      folder: cloudinaryFolder,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
    });
  } catch (error) {
    console.error('Cloudinary upload failed', error);
    const cloudinaryMessage: string =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Could not upload the file to Cloudinary.';
    const httpCode: number | undefined =
      error && typeof error === 'object' && 'http_code' in error && typeof error.http_code === 'number'
        ? error.http_code
        : undefined;
    const isPermissionDenied: boolean =
      httpCode === 403 ||
      cloudinaryMessage.includes('403') ||
      cloudinaryMessage.includes('missing permissions') ||
      cloudinaryMessage.includes('Request forbidden');
    if (isPermissionDenied) {
      throw new HttpError(
        502,
        'UPLOAD_FAILED',
        'Cloudinary API key is missing upload (create) permission. In Cloudinary Console → Settings → API Keys, enable Create on this key (or generate a new full-access key) and update CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env, then restart the API.',
      );
    }
    throw new HttpError(502, 'UPLOAD_FAILED', cloudinaryMessage);
  }
  let created: DbFile & { user: { name: string } };
  try {
    created = await prisma.file.create({
      data: {
        userId: input.userId,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        bytes: uploaded.bytes || input.file.size,
        cloudinaryPublicId: uploaded.publicId,
        cloudinaryResourceType: uploaded.resourceType,
        secureUrl: uploaded.secureUrl,
        visibility,
        folderId: resolvedFolderId,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
  } catch (error) {
    await deleteCloudinaryAsset({
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
    }).catch(() => undefined);
    console.error('Failed to persist uploaded file metadata', error);
    throw new HttpError(500, 'UPLOAD_PERSIST_FAILED', 'Upload succeeded but saving metadata failed.');
  }
  const fileDto: VaultFileDto = mapFileToDto(created);
  const storage = await getStorageSummaryForUser(input.userId);
  return { file: fileDto, storage };
}

export async function deleteUserFile(input: {
  userId: string;
  fileId: string;
  permanent?: boolean;
}): Promise<{ ok: true; storage: Awaited<ReturnType<typeof getStorageSummaryForUser>> }> {
  const existing = await prisma.file.findFirst({
    where: {
      id: input.fileId,
      userId: input.userId,
    },
  });
  if (!existing) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  if (input.permanent) {
    if (!existing.deletedAt) {
      throw new HttpError(400, 'NOT_IN_TRASH', 'Move the file to trash before deleting it forever.');
    }
    try {
      await deleteCloudinaryAsset({
        publicId: existing.cloudinaryPublicId,
        resourceType: existing.cloudinaryResourceType,
      });
    } catch (error) {
      console.error('Cloudinary delete failed', error);
      throw new HttpError(502, 'DELETE_FAILED', 'Could not delete the file from Cloudinary.');
    }
    await prisma.file.delete({ where: { id: existing.id } });
    const storage = await getStorageSummaryForUser(input.userId);
    return { ok: true, storage };
  }
  if (existing.deletedAt) {
    throw new HttpError(400, 'ALREADY_IN_TRASH', 'This file is already in trash.');
  }
  await prisma.file.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  const storage = await getStorageSummaryForUser(input.userId);
  return { ok: true, storage };
}

function getFileExtension(fileName: string): string {
  const lastDot: number = fileName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return '';
  }
  return fileName.slice(lastDot);
}

function resolveRenamedFileName(currentName: string, nextName: string): string {
  const trimmedName: string = nextName.trim();
  if (trimmedName === '.' || trimmedName === '..') {
    throw new HttpError(400, 'INVALID_FILE_NAME', 'Enter a valid file name.');
  }
  const currentExt: string = getFileExtension(currentName);
  const nextExt: string = getFileExtension(trimmedName);
  if (currentExt && !nextExt) {
    return `${trimmedName}${currentExt}`;
  }
  return trimmedName;
}

export async function updateUserFile(input: {
  userId: string;
  fileId: string;
  name?: string;
  visibility?: FileVisibility;
}): Promise<UpdateFileResponse> {
  const existing = await prisma.file.findFirst({
    where: {
      id: input.fileId,
      userId: input.userId,
    },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  if (!existing) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  if (existing.deletedAt) {
    throw new HttpError(400, 'FILE_IN_TRASH', 'Restore the file before changing it.');
  }
  const nextName: string | undefined =
    input.name !== undefined ? resolveRenamedFileName(existing.originalName, input.name) : undefined;
  const nextVisibility: FileVisibility | undefined = input.visibility;
  const hasNameChange: boolean = nextName !== undefined && nextName !== existing.originalName;
  const hasVisibilityChange: boolean =
    nextVisibility !== undefined && nextVisibility !== existing.visibility;
  if (!hasNameChange && !hasVisibilityChange) {
    const storage = await getStorageSummaryForUser(input.userId);
    return { file: mapFileToDto(existing), storage };
  }
  const updated = await prisma.file.update({
    where: { id: existing.id },
    data: {
      ...(hasNameChange ? { originalName: nextName } : {}),
      ...(hasVisibilityChange ? { visibility: nextVisibility } : {}),
    },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  const storage = await getStorageSummaryForUser(input.userId);
  return { file: mapFileToDto(updated), storage };
}

export async function restoreUserFile(input: {
  userId: string;
  fileId: string;
}): Promise<{ ok: true; storage: Awaited<ReturnType<typeof getStorageSummaryForUser>> }> {
  const existing = await prisma.file.findFirst({
    where: {
      id: input.fileId,
      userId: input.userId,
    },
  });
  if (!existing) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  if (!existing.deletedAt) {
    throw new HttpError(400, 'NOT_IN_TRASH', 'This file is not in trash.');
  }
  await prisma.file.update({
    where: { id: existing.id },
    data: { deletedAt: null },
  });
  const storage = await getStorageSummaryForUser(input.userId);
  return { ok: true, storage };
}

async function hasFileShareAccess(fileId: string, viewerId: string): Promise<boolean> {
  const share = await prisma.fileShare.findUnique({
    where: {
      fileId_userId: {
        fileId,
        userId: viewerId,
      },
    },
  });
  return share !== null;
}

async function assertCanAccessSharedFile(
  file: { id: string; userId: string; visibility: string },
  viewerId?: string,
): Promise<void> {
  if (file.visibility === 'PUBLIC' || file.visibility === 'LINK') {
    return;
  }
  if (file.userId === viewerId) {
    return;
  }
  if (!viewerId) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to view this file.');
  }
  if (file.visibility === 'PRIVATE') {
    throw new HttpError(403, 'FILE_FORBIDDEN', 'This file is private.');
  }
  if (file.visibility === 'SHARED') {
    const isSharedWithViewer: boolean = await hasFileShareAccess(file.id, viewerId);
    if (!isSharedWithViewer) {
      throw new HttpError(403, 'FILE_FORBIDDEN', 'This file is private.');
    }
  }
}

export async function getSharedFile(input: {
  fileId: string;
  viewerId?: string;
}): Promise<SharedFileDto> {
  const file = await prisma.file.findUnique({
    where: { id: input.fileId },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
  if (!file || file.deletedAt) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  await assertCanAccessSharedFile(file, input.viewerId);
  return mapFileToSharedDto(file);
}

export async function getSharedFileAsset(input: {
  fileId: string;
  viewerId?: string;
}): Promise<{
  originalName: string;
  mimeType: string;
  cloudinaryPublicId: string;
  cloudinaryResourceType: string;
}> {
  const file = await prisma.file.findUnique({
    where: { id: input.fileId },
  });
  if (!file || file.deletedAt) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.');
  }
  await assertCanAccessSharedFile(file, input.viewerId);
  return {
    originalName: file.originalName,
    mimeType: file.mimeType,
    cloudinaryPublicId: file.cloudinaryPublicId,
    cloudinaryResourceType: file.cloudinaryResourceType,
  };
}

export async function streamSharedFileContent(input: {
  fileId: string;
  viewerId?: string;
}): Promise<{
  originalName: string;
  mimeType: string;
  body: ReadableStream<Uint8Array>;
}> {
  const asset = await getSharedFileAsset(input);
  const upstream = await fetchCloudinaryAsset({
    publicId: asset.cloudinaryPublicId,
    resourceType: asset.cloudinaryResourceType,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
  });
  if (!upstream.ok || !upstream.body) {
    throw new HttpError(502, 'FILE_FETCH_FAILED', 'Could not load the file from storage.');
  }
  return {
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    body: upstream.body,
  };
}

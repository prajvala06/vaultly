import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { assertCloudinaryConfigured, env } from '../config/env.js';

let isConfigured = false;

/** Keep assets non-public on Cloudinary; Vaultly gates access via /api/files/:id/content. */
export const CLOUDINARY_ACCESS_TYPE = 'authenticated' as const;

export function configureCloudinary(): void {
  if (isConfigured) {
    return;
  }
  assertCloudinaryConfigured();
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  isConfigured = true;
}

export type CloudinaryUploadResult = {
  publicId: string;
  resourceType: string;
  secureUrl: string;
  bytes: number;
  format?: string;
};

function resolveCloudinaryFormat(originalName: string, mimeType: string): string {
  const extension: string = path.extname(originalName).slice(1).toLowerCase();
  if (extension.length > 0) {
    return extension;
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType.startsWith('image/')) {
    return mimeType.split('/')[1] ?? '';
  }
  return '';
}

export function buildCloudinaryDownloadUrl(input: {
  publicId: string;
  resourceType: string;
  originalName: string;
  mimeType: string;
  accessType?: 'authenticated' | 'upload' | 'private';
}): string {
  configureCloudinary();
  const format: string = resolveCloudinaryFormat(input.originalName, input.mimeType);
  return cloudinary.utils.private_download_url(input.publicId, format, {
    resource_type: input.resourceType,
    type: input.accessType ?? CLOUDINARY_ACCESS_TYPE,
  });
}

export async function fetchCloudinaryAsset(input: {
  publicId: string;
  resourceType: string;
  originalName: string;
  mimeType: string;
}): Promise<Response> {
  const authenticatedUrl: string = buildCloudinaryDownloadUrl({
    ...input,
    accessType: 'authenticated',
  });
  const authenticatedResponse: Response = await fetch(authenticatedUrl);
  if (authenticatedResponse.ok) {
    return authenticatedResponse;
  }
  // Older assets may still be public `upload` type.
  const publicUrl: string = buildCloudinaryDownloadUrl({
    ...input,
    accessType: 'upload',
  });
  return fetch(publicUrl);
}

export async function uploadBufferToCloudinary(input: {
  buffer: Buffer;
  folder: string;
  originalName: string;
  mimeType: string;
}): Promise<CloudinaryUploadResult> {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: input.folder,
        resource_type: 'auto',
        type: CLOUDINARY_ACCESS_TYPE,
        use_filename: true,
        unique_filename: true,
        filename_override: input.originalName,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          secureUrl: result.secure_url,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(input.buffer);
  });
}

export async function deleteCloudinaryAsset(input: {
  publicId: string;
  resourceType: string;
}): Promise<void> {
  configureCloudinary();
  const authenticatedResult = await cloudinary.uploader.destroy(input.publicId, {
    resource_type: input.resourceType,
    type: CLOUDINARY_ACCESS_TYPE,
  });
  if (authenticatedResult.result === 'ok' || authenticatedResult.result === 'not found') {
    return;
  }
  await cloudinary.uploader.destroy(input.publicId, {
    resource_type: input.resourceType,
    type: 'upload',
  });
}

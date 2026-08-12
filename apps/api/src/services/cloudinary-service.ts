import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { assertCloudinaryConfigured, env } from '../config/env.js';

let isConfigured = false;

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
}): string {
  configureCloudinary();
  const format: string = resolveCloudinaryFormat(input.originalName, input.mimeType);
  return cloudinary.utils.private_download_url(input.publicId, format, {
    resource_type: input.resourceType,
    type: 'upload',
  });
}

export async function fetchCloudinaryAsset(input: {
  publicId: string;
  resourceType: string;
  originalName: string;
  mimeType: string;
}): Promise<Response> {
  const downloadUrl: string = buildCloudinaryDownloadUrl(input);
  const response: Response = await fetch(downloadUrl);
  return response;
}

export async function createSignedUploadParams(input: {
  userId: string;
  folder?: string;
}): Promise<{
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}> {
  configureCloudinary();
  const timestamp: number = Math.round(Date.now() / 1000);
  const folder: string = input.folder ?? `${env.cloudinaryFolder}/${input.userId}`;
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    use_filename: 'true',
    unique_filename: 'true',
  };
  const signature: string = cloudinary.utils.api_sign_request(paramsToSign, env.cloudinaryApiSecret);
  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    signature,
    folder,
  };
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
  await cloudinary.uploader.destroy(input.publicId, {
    resource_type: input.resourceType,
  });
}

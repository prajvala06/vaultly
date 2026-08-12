import type { ApiResponse } from '@vaultly/shared';
import { forceClientLogout } from '@/lib/auth-session';

const DEFAULT_API_URL = 'http://localhost:4000';

export function getApiBaseUrl(): string {
  const value: string | undefined = process.env.NEXT_PUBLIC_API_URL?.trim();
  return value && value.length > 0 ? value.replace(/\/$/, '') : DEFAULT_API_URL;
}

export function getAppShareUrl(fileId: string): string {
  if (typeof window === 'undefined') {
    return `/share/${fileId}`;
  }
  return `${window.location.origin}/share/${fileId}`;
}

export function getFileContentUrl(fileId: string, download = false): string {
  const suffix: string = download ? '?download=1' : '';
  return `${getApiBaseUrl()}/api/files/${fileId}/content${suffix}`;
}

export async function downloadVaultFile(fileId: string, fileName: string): Promise<void> {
  const response: Response = await fetch(getFileContentUrl(fileId, true), {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new ApiClientError(response.status, 'DOWNLOAD_FAILED', 'Could not download the file.');
  }
  const blob: Blob = await response.blob();
  const objectUrl: string = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isUnauthenticatedError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === 'UNAUTHENTICATED';
}

function handleUnauthenticatedResponse(code: string): void {
  if (code === 'UNAUTHENTICATED') {
    forceClientLogout('/');
  }
}

async function parseApiResponse<T>(response: Response, skipAuthRedirect = false): Promise<T> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(response.status, 'INVALID_RESPONSE', 'Unexpected server response.');
  }
  if (!body.success) {
    if (!skipAuthRedirect) {
      handleUnauthenticatedResponse(body.error.code);
    }
    throw new ApiClientError(response.status, body.error.code, body.error.message);
  }
  return body.data;
}

type ApiRequestInit = RequestInit & {
  skipAuthRedirect?: boolean;
};

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { skipAuthRedirect, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  const isFormData: boolean = typeof FormData !== 'undefined' && fetchInit.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response: Response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchInit,
    credentials: 'include',
    headers,
  });
  return parseApiResponse<T>(response, skipAuthRedirect);
}

export async function apiUploadFile<T>(
  _path: string,
  file: File,
  options?: {
    visibility?: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';
    folderId?: string | null;
    onProgress?: (percent: number) => void;
  },
): Promise<T> {
  const signature = await apiRequest<{
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    maxFileSizeBytes: number;
  }>('/api/files/upload-signature', {
    method: 'POST',
    body: JSON.stringify({ bytes: file.size }),
  });
  if (file.size > signature.maxFileSizeBytes) {
    throw new ApiClientError(
      400,
      'FILE_TOO_LARGE',
      `File exceeds the maximum size of ${Math.round(signature.maxFileSizeBytes / (1024 * 1024))} MB.`,
    );
  }
  const cloudinaryResult = await new Promise<{
    public_id: string;
    secure_url: string;
    bytes: number;
    resource_type: string;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`);
    xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
      if (!options?.onProgress || !event.lengthComputable || event.total <= 0) {
        return;
      }
      const percent: number = Math.round((event.loaded / event.total) * 100);
      options.onProgress(Math.min(95, Math.max(0, percent)));
    };
    xhr.upload.onloadstart = () => {
      options?.onProgress?.(0);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          public_id?: string;
          secure_url?: string;
          bytes?: number;
          resource_type?: string;
          error?: { message?: string };
        };
        if (xhr.status < 200 || xhr.status >= 300 || !body.public_id || !body.secure_url) {
          reject(
            new ApiClientError(
              xhr.status || 502,
              'UPLOAD_FAILED',
              body.error?.message ?? 'Cloudinary upload failed.',
            ),
          );
          return;
        }
        resolve({
          public_id: body.public_id,
          secure_url: body.secure_url,
          bytes: body.bytes ?? file.size,
          resource_type: body.resource_type ?? 'raw',
        });
      } catch {
        reject(new ApiClientError(xhr.status, 'INVALID_RESPONSE', 'Unexpected Cloudinary response.'));
      }
    };
    xhr.onerror = () => {
      reject(new ApiClientError(0, 'NETWORK_ERROR', 'Could not reach Cloudinary.'));
    };
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    formData.append('use_filename', 'true');
    formData.append('unique_filename', 'true');
    xhr.send(formData);
  });
  options?.onProgress?.(97);
  const completed = await apiRequest<T>('/api/files/complete-upload', {
    method: 'POST',
    body: JSON.stringify({
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      bytes: cloudinaryResult.bytes,
      resourceType: cloudinaryResult.resource_type,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      visibility: options?.visibility ?? 'PRIVATE',
      folderId: options?.folderId ?? null,
    }),
  });
  options?.onProgress?.(100);
  return completed;
}

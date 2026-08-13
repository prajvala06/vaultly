import type { ApiResponse, ListFileSharesResponse } from '@vaultly/shared';
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

export async function getFileShares(fileId: string): Promise<ListFileSharesResponse> {
  return apiRequest(`/api/files/${fileId}/shares`);
}

export async function apiUploadFile<T>(
  path: string,
  file: File,
  options?: {
    visibility?: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';
    folderId?: string | null;
    onProgress?: (percent: number) => void;
  },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiBaseUrl()}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
      if (!options?.onProgress || !event.lengthComputable || event.total <= 0) {
        return;
      }
      const percent: number = Math.round((event.loaded / event.total) * 100);
      options.onProgress(Math.min(99, Math.max(0, percent)));
    };
    xhr.upload.onloadstart = () => {
      options?.onProgress?.(0);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as ApiResponse<T>;
        if (!body.success) {
          handleUnauthenticatedResponse(body.error.code);
          reject(new ApiClientError(xhr.status, body.error.code, body.error.message));
          return;
        }
        options?.onProgress?.(100);
        resolve(body.data);
      } catch {
        reject(new ApiClientError(xhr.status, 'INVALID_RESPONSE', 'Unexpected server response.'));
      }
    };
    xhr.onerror = () => {
      reject(
        new ApiClientError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the API running?'),
      );
    };
    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', options?.visibility ?? 'PRIVATE');
    if (options?.folderId) {
      formData.append('folderId', options.folderId);
    }
    xhr.send(formData);
  });
}

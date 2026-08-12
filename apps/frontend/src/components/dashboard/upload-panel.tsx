'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { FileVisibility, StorageSummaryDto, UploadFileResponse } from '@vaultly/shared';
import { CloseIcon, UploadCloudIcon } from '@/components/icons';
import { FileTypeIcon, getFileTypeTone } from '@/components/ui/badges';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiUploadFile, isUnauthenticatedError } from '@/lib/api-client';
import { forceClientLogout } from '@/lib/auth-session';
import type { VaultFile } from '@/lib/vault-file';

type UploadPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId?: string | null;
  onUploaded: (file: VaultFile, storage: StorageSummaryDto) => void;
};

type PendingFile = {
  id: string;
  file: File;
  type: VaultFile['type'];
  visibility: FileVisibility;
};

type ActiveUpload = {
  name: string;
  sizeBytes: number;
  progress: number;
  type: VaultFile['type'];
  status: 'uploading' | 'done' | 'error';
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units: readonly string[] = ['KB', 'MB', 'GB', 'TB'];
  let value: number = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded: string = value >= 10 || unitIndex <= 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function resolveLocalFileType(file: File): VaultFile['type'] {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  if (file.type.includes('zip') || /\.(zip|rar|7z)$/i.test(file.name)) {
    return 'zip';
  }
  if (file.type.includes('word') || /\.(docx?|txt)$/i.test(file.name)) {
    return 'doc';
  }
  return 'other';
}

function createPendingFile(file: File): PendingFile {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    type: resolveLocalFileType(file),
    visibility: 'PRIVATE',
  };
}

export function UploadPanel({
  isOpen,
  onClose,
  targetFolderId = null,
  onUploaded,
}: UploadPanelProps): React.ReactElement {
  const { pushToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const overlayTone = getFileTypeTone(activeUpload?.type ?? 'other');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isUploading) {
        onClose();
      }
    }
    const previousOverflow: string = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isUploading, onClose]);

  function addFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const nextFiles: PendingFile[] = Array.from(fileList).map(createPendingFile);
    setPendingFiles((current) => [...current, ...nextFiles]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function removePendingFile(id: string): void {
    setPendingFiles((current) => current.filter((item) => item.id !== id));
  }

  function toggleVisibility(id: string): void {
    setPendingFiles((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              visibility: item.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC',
            }
          : item,
      ),
    );
  }

  function setPrivateAccess(id: string, access: FileVisibility): void {
    setPendingFiles((current) =>
      current.map((item): PendingFile =>
        item.id === id
          ? {
              ...item,
              visibility: access,
            }
          : item,
      ),
    );
  }

  async function uploadQueue(queue: PendingFile[]): Promise<void> {
    setIsUploading(true);
    onClose();
    let successCount = 0;
    try {
      for (const pending of queue) {
        setActiveUpload({
          name: pending.file.name,
          sizeBytes: pending.file.size,
          progress: 0,
          type: pending.type,
          status: 'uploading',
        });
        try {
          const result = await apiUploadFile<UploadFileResponse>(
            '/api/files/upload',
            pending.file,
            {
              visibility: pending.visibility,
              folderId: targetFolderId,
              onProgress: (percent) => {
                setActiveUpload((current) =>
                  current
                    ? {
                        ...current,
                        progress: percent,
                      }
                    : current,
                );
              },
            },
          );
          onUploaded(result.file, result.storage);
          successCount += 1;
          setActiveUpload((current) =>
            current
              ? {
                  ...current,
                  progress: 100,
                  status: 'done',
                }
              : current,
          );
        } catch (error) {
          if (isUnauthenticatedError(error)) {
            pushToast({
              tone: 'error',
              title: 'Session expired',
              message: 'Please sign in again to continue.',
            });
            forceClientLogout('/');
            return;
          }
          const message: string =
            error instanceof ApiClientError
              ? error.message
              : 'Could not upload the file. Please try again.';
          pushToast({ tone: 'error', message });
          setActiveUpload((current) =>
            current
              ? {
                  ...current,
                  status: 'error',
                }
              : current,
          );
        }
      }
      if (successCount > 0) {
        pushToast({
          tone: 'success',
          title: 'Upload complete',
          message:
            successCount === 1
              ? 'Your file is now in your vault.'
              : `${successCount} files are now in your vault.`,
        });
      }
    } finally {
      setIsUploading(false);
      window.setTimeout(() => {
        setActiveUpload(null);
      }, 1800);
      setPendingFiles([]);
    }
  }

  function handleStartUpload(): void {
    if (pendingFiles.length === 0 || isUploading) {
      return;
    }
    void uploadQueue([...pendingFiles]);
  }

  function handleCloseDialog(): void {
    if (isUploading) {
      return;
    }
    onClose();
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
          >
            <motion.button
              type="button"
              aria-label="Close upload dialog"
              className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleCloseDialog}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="upload-dialog-title"
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
            >
              <div className="flex items-center justify-between border-b border-vaultly-border px-5 py-4">
                <div>
                  <h2
                    id="upload-dialog-title"
                    className="text-sm font-bold text-gray-800 md:text-base lg:text-xl"
                  >
                    Upload files
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-400 md:text-base">
                    Choose files, set visibility, then upload
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleCloseDialog}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                >
                  <CloseIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
              <div className="max-h-[min(70vh,560px)] space-y-4 overflow-y-auto p-5">
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => addFiles(event.target.files)}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                    isDragging
                      ? 'border-gray-400 bg-gray-200'
                      : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex h-14 w-14 items-center justify-center text-gray-400">
                    <UploadCloudIcon className="h-12 w-12" />
                  </span>
                  <span className="text-sm font-semibold text-gray-600 md:text-base">
                    Drop files here or browse
                  </span>
                  <span className="text-sm text-gray-400">Up to 100 MB per file</span>
                </button>

                {pendingFiles.length > 0 ? (
                  <ul className="space-y-3">
                    {pendingFiles.map((pending) => {
                      const tone = getFileTypeTone(pending.type);
                      const isPublic: boolean = pending.visibility === 'PUBLIC';
                      return (
                        <li
                          key={pending.id}
                          className="rounded-2xl border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.wrap}`}
                            >
                              <FileTypeIcon type={pending.type} className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-vaultly-ink">
                                    {pending.file.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-vaultly-muted">
                                    {formatBytes(pending.file.size)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Remove ${pending.file.name}`}
                                  onClick={() => removePendingFile(pending.id)}
                                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                                >
                                  <CloseIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                                </button>
                              </div>
                              <div className="mt-3 w-full flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="text-sm font-medium text-gray-600">
                                    Visibility
                                  </p>
                                  {isPublic ? (
                                    <p className="mt-0.5 text-sm leading-snug text-gray-600">
                                      Anyone can view this file.
                                    </p>
                                  ) : (
                                    <label className="mt-1 block">
                                      <span className="sr-only">Who can access</span>
                                      <select
                                        value={
                                          pending.visibility === 'PUBLIC'
                                            ? 'PRIVATE'
                                            : pending.visibility
                                        }
                                        onChange={(event) => {
                                          const value: string = event.target.value;
                                          if (value === 'LINK' || value === 'SHARED') {
                                            setPrivateAccess(pending.id, value as FileVisibility);
                                            return;
                                          }
                                          setPrivateAccess(pending.id, 'PRIVATE');
                                        }}
                                        className="mt-0.5 w-auto cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white bg-size-[12px] bg-position-[right_8px_center] bg-no-repeat py-1.5 pr-7 pl-2 text-sm leading-snug text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-gray-400"
                                        style={{
                                          backgroundImage:
                                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
                                        }}
                                      >
                                        <option value="PRIVATE">Only me</option>
                                        <option value="LINK">People with the link</option>
                                        <option value="SHARED">People you add</option>
                                      </select>
                                    </label>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isPublic}
                                  aria-label={isPublic ? 'Public' : 'Private'}
                                  onClick={() => toggleVisibility(pending.id)}
                                  className={`relative inline-flex h-8 w-23 shrink-0 items-center rounded-full transition-colors ${
                                    isPublic ? 'bg-green-500' : 'bg-gray-500'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none absolute inset-y-0 flex items-center text-[10px] font-bold tracking-wide text-white uppercase transition-all ${
                                      isPublic ? 'left-2.5' : 'right-2.5'
                                    }`}
                                  >
                                    {isPublic ? 'Public' : 'Private'}
                                  </span>
                                  <span
                                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                                      isPublic ? 'translate-x-15' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-vaultly-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-sm font-semibold text-vaultly-ink underline-offset-2 hover:underline"
                >
                  Add more
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    disabled={pendingFiles.length === 0}
                    onClick={handleStartUpload}
                  >
                    Upload{pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeUpload ? (
          <motion.div
            className="pointer-events-none fixed right-4 bottom-4 z-[90] w-[min(100vw-2rem,360px)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="pointer-events-auto rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${overlayTone.wrap}`}
                >
                  <FileTypeIcon type={activeUpload.type} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-vaultly-ink">
                    {activeUpload.name}
                  </p>
                  <p className="mt-0.5 text-xs text-vaultly-muted">
                    {formatBytes(
                      Math.round((activeUpload.sizeBytes * activeUpload.progress) / 100),
                    )}{' '}
                    / {formatBytes(activeUpload.sizeBytes)}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full w-0 max-w-full rounded-full transition-[width] duration-200 ${
                        activeUpload.status === 'error'
                          ? 'bg-rose-400'
                          : activeUpload.status === 'done'
                            ? 'bg-emerald-400'
                            : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, activeUpload.progress))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">{activeUpload.progress}%</span>
                    <span className="text-gray-400">
                      {activeUpload.status === 'done'
                        ? 'Done'
                        : activeUpload.status === 'error'
                          ? 'Failed'
                          : 'Uploading...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

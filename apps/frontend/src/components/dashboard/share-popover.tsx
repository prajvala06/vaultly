'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { FileShareDto, FileVisibility } from '@vaultly/shared';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, getAppShareUrl, getFileShares } from '@/lib/api-client';

type SharePopoverProps = {
  fileName: string;
  fileId: string;
  ownerName: string;
  visibility: FileVisibility;
  isOpen: boolean;
  onClose: () => void;
  onVisibilityChange?: (visibility: FileVisibility) => Promise<void>;
};

type GeneralAccessMode = 'restricted' | 'anyone';

function getGeneralAccessMode(visibility: FileVisibility): GeneralAccessMode {
  return visibility === 'PUBLIC' || visibility === 'LINK' ? 'anyone' : 'restricted';
}

function getShareHint(visibility: FileVisibility): string {
  if (visibility === 'PRIVATE') {
    return 'Only people with access can open with the link';
  }
  if (visibility === 'SHARED') {
    return 'People you add can open with the link';
  }
  return 'Anyone on the internet with the link can view';
}

function getInitials(name: string): string {
  const parts: string[] = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function SharePopover({
  fileName,
  fileId,
  ownerName,
  visibility,
  isOpen,
  onClose,
  onVisibilityChange,
}: SharePopoverProps): React.ReactElement {
  const { pushToast } = useToast();
  const accessMenuRef = useRef<HTMLDivElement | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shares, setShares] = useState<FileShareDto[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState<boolean>(false);
  const [isAccessMenuOpen, setIsAccessMenuOpen] = useState<boolean>(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<boolean>(false);
  const shareUrl: string = getAppShareUrl(fileId);
  const accessMode: GeneralAccessMode = getGeneralAccessMode(visibility);

  useEffect(() => {
    if (!isOpen) {
      setShareEmail('');
      setShares([]);
      setIsLoadingShares(false);
      setIsAccessMenuOpen(false);
      return;
    }
    let isCancelled = false;
    setIsLoadingShares(true);
    void getFileShares(fileId)
      .then((result) => {
        if (!isCancelled) {
          setShares(result.shares);
        }
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        const message: string =
          error instanceof ApiClientError ? error.message : 'Could not load people with access.';
        pushToast({ tone: 'error', message });
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingShares(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [fileId, isOpen, pushToast]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') {
        return;
      }
      event.stopPropagation();
      if (isAccessMenuOpen) {
        setIsAccessMenuOpen(false);
        return;
      }
      onClose();
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAccessMenuOpen, isOpen, onClose]);

  useEffect(() => {
    if (!isAccessMenuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent): void {
      if (!accessMenuRef.current?.contains(event.target as Node)) {
        setIsAccessMenuOpen(false);
      }
    }
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isAccessMenuOpen]);

  function handleCopy(): void {
    void navigator.clipboard?.writeText(shareUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  }

  async function handleShareWithUser(): Promise<void> {
    const email: string = shareEmail.trim();
    if (!email) {
      pushToast({ tone: 'error', message: 'Enter an email address to share with.' });
      return;
    }
    setIsSharing(true);
    try {
      await apiRequest<{ ok: true }>(`/api/files/${fileId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setShareEmail('');
      const result = await getFileShares(fileId);
      setShares(result.shares);
      pushToast({
        tone: 'success',
        title: 'File shared',
        message: `${email} can now find this file under Shared with me.`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({ tone: 'error', message: 'Could not share this file. Please try again.' });
    } finally {
      setIsSharing(false);
    }
  }

  async function handleSelectAccess(mode: GeneralAccessMode): Promise<void> {
    if (!onVisibilityChange || mode === accessMode || isUpdatingAccess) {
      setIsAccessMenuOpen(false);
      return;
    }
    const nextVisibility: FileVisibility =
      mode === 'anyone' ? 'LINK' : shares.length > 0 ? 'SHARED' : 'PRIVATE';
    setIsUpdatingAccess(true);
    try {
      await onVisibilityChange(nextVisibility);
      setIsAccessMenuOpen(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({ tone: 'error', message: 'Could not update access. Please try again.' });
    } finally {
      setIsUpdatingAccess(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close share overlay"
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            className="relative z-10 w-full max-w-xl rounded-xl bg-white text-[#1f1f1f] shadow-[0_24px_38px_rgba(0,0,0,0.14)]"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <div className="p-6 pb-2">
              <div className="mb-5 flex items-start justify-between gap-4">
                <h3
                  id="share-dialog-title"
                  className="text-lg font-normal leading-tight text-gray-900 line-clamp-2"
                >
                  Share '{fileName}'
                </h3>
              </div>

              <div className="relative mb-6">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(event) => setShareEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && shareEmail.trim().length > 0) {
                      void handleShareWithUser();
                    }
                  }}
                  placeholder="Add people by email"
                  className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3.5 text-[15px] outline-none transition-all hover:border-black focus:border-[#0b57d0] focus:ring-[1.5px] focus:ring-[#0b57d0] placeholder:text-gray-600"
                />
                {shareEmail.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleShareWithUser();
                    }}
                    disabled={isSharing}
                    className="absolute right-2 top-2 rounded bg-[#0b57d0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-70"
                  >
                    {isSharing ? 'Sharing...' : 'Share'}
                  </button>
                )}
              </div>

              <div className="mb-6">
                <h4 className="mb-3 text-[15px] font-medium text-gray-800">Who can access</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b57d0] text-sm font-medium text-white">
                      {getInitials(ownerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-gray-900">
                        {ownerName} (you)
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">Owner</span>
                  </div>
                  {isLoadingShares ? (
                    <p className="pl-11 text-sm text-gray-500">Loading people...</p>
                  ) : (
                    shares.map((share) => (
                      <div key={share.userId} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-medium text-[#0b57d0]">
                          {getInitials(share.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-medium text-gray-900">{share.name}</p>
                          <p className="truncate text-sm text-gray-500">{share.email}</p>
                        </div>
                        <span className="text-sm text-gray-500">Viewer</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="mb-2 text-[15px] font-medium text-gray-800">General access</h4>
                <div className="relative" ref={accessMenuRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isAccessMenuOpen}
                    disabled={isUpdatingAccess || !onVisibilityChange}
                    onClick={() => setIsAccessMenuOpen((current) => !current)}
                    className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-70"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {accessMode === 'anyone' ? (
                        <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[15px] font-medium text-gray-900">
                          {accessMode === 'anyone' ? 'Anyone with the link' : 'Restricted'}
                        </p>
                        <svg
                          className={`h-4 w-4 text-gray-600 transition-transform ${isAccessMenuOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {isUpdatingAccess ? 'Updating access...' : getShareHint(visibility)}
                      </p>
                    </div>
                  </button>
                  {isAccessMenuOpen ? (
                    <div
                      role="listbox"
                      aria-label="General access"
                      className="absolute left-0 top-full z-20 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={accessMode === 'restricted'}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] text-gray-900 hover:bg-gray-50"
                        onClick={() => {
                          void handleSelectAccess('restricted');
                        }}
                      >
                        <span className="flex w-5 justify-center text-[#0b57d0]">
                          {accessMode === 'restricted' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        Restricted
                      </button>
                      <button
                        type="button"
                        role="option"
                        aria-selected={accessMode === 'anyone'}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] text-gray-900 hover:bg-gray-50"
                        onClick={() => {
                          void handleSelectAccess('anyone');
                        }}
                      >
                        <span className="flex w-5 justify-center text-[#0b57d0]">
                          {accessMode === 'anyone' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        Anyone with the link
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-b-[28px] border-t border-transparent bg-gray-50/50 px-6 py-4">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-[15px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f2f6fc] focus:bg-[#e8f0fe] focus:outline-none"
              >
                {isCopied ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
                {isCopied ? 'Link copied' : 'Copy link'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#0b57d0] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[#0b57d0] focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

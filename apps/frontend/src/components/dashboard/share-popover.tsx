'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CloseIcon, CopyIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest, getAppShareUrl } from '@/lib/api-client';

type SharePopoverProps = {
  fileName: string;
  fileId: string;
  visibility: 'PRIVATE' | 'LINK' | 'SHARED' | 'PUBLIC';
  isOpen: boolean;
  onClose: () => void;
};

function getShareHint(visibility: SharePopoverProps['visibility']): string {
  if (visibility === 'PRIVATE') {
    return 'Only you can open this link. Set visibility to Public with the link to share it.';
  }
  if (visibility === 'SHARED') {
    return 'People you add can open this file in Vaultly';
  }
  return 'Anyone with this link can view the file in Vaultly';
}

export function SharePopover({
  fileName,
  fileId,
  visibility,
  isOpen,
  onClose,
}: SharePopoverProps): React.ReactElement {
  const { pushToast } = useToast();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [shareEmail, setShareEmail] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const shareUrl: string = getAppShareUrl(fileId);

  useEffect(() => {
    if (!isOpen) {
      setShareEmail('');
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  function handleCopy(): void {
    void navigator.clipboard?.writeText(shareUrl);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1500);
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
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 ">
                <h3
                  id="share-dialog-title"
                  className="text-base md:text-lg lg:text-xl font-semibold text-vaultly-ink"
                >
                  Share File
                </h3>


              </div>
              <button
                type="button"
                aria-label="Close share dialog"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-500 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <CloseIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>
            <div className="h-0.5 w-full bg-gray-200 my-2"></div>
            <p className="mt-0.5 truncate text-sm font-medium text-vaultly-ink-soft">
              {fileName}
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-gray-100 px-3 py-2.5 mt-4">
              <p className="min-w-0 flex-1 truncate text-xs text-vaultly-ink-soft">{shareUrl}</p>
              <Button
                variant="primary"
                className="shrink-0 rounded-full px-2.5 py-1.5 text-xs"
                onClick={handleCopy}
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 text-xs md:text-sm leading-relaxed text-gray-600">
              {getShareHint(visibility)}
            </p>
            {visibility === 'SHARED' || visibility === 'PRIVATE' ? (
              <div className="mt-4 space-y-2">

                <div className="flex items-center gap-2">

                  <div className="h-0.5 w-full bg-gray-200 my-2"></div>
                  <span className="text-xs text-gray-500">Or</span>
                  <div className="h-0.5 w-full bg-gray-200 my-2"></div>
                </div>
                <label className="block text-xs font-medium text-vaultly-ink-soft">
                  Share with a Vaultly user
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(event) => setShareEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-vaultly-ink outline-none transition-colors focus:border-vaultly-ink"
                  />
                  <Button
                    variant="primary"
                    className="shrink-0 rounded-xl px-3 py-2 text-xs"
                    disabled={isSharing}
                    onClick={() => {
                      void handleShareWithUser();
                    }}
                  >
                    {isSharing ? 'Sharing...' : 'Add'}
                  </Button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

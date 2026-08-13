'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import type { DeleteFolderResponse, VaultFolderDto } from '@vaultly/shared';

type DeleteFolderDialogProps = {
  folder: VaultFolderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (folderId: string) => void;
};

export function DeleteFolderDialog({
  folder,
  isOpen,
  onClose,
  onDeleted,
}: DeleteFolderDialogProps): React.ReactElement {
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  async function handleDelete(): Promise<void> {
    if (!folder) {
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest<DeleteFolderResponse>(`/api/folders/${folder.id}`, {
        method: 'DELETE',
      });
      onDeleted(folder.id);
      onClose();
      pushToast({
        tone: 'success',
        title: 'Folder deleted',
        message: `"${folder.name}" was removed. Files stay in My Files.`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        pushToast({ tone: 'error', message: error.message });
        return;
      }
      pushToast({ tone: 'error', message: 'Could not delete the folder. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && folder ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close delete folder dialog"
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
            aria-labelledby="delete-folder-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="delete-folder-title"
                  className="text-base font-semibold text-vaultly-ink md:text-lg lg:text-xl"
                >
                  Delete folder?
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  “{folder.name}” will be removed. Files inside stay in My Files.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <CloseIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={isSubmitting}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete folder'}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

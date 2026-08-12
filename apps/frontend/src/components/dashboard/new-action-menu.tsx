'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { FolderIcon, UploadCloudIcon } from '@/components/icons';

type NewActionMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: () => void;
  onCreateFolder: () => void;
};

export function NewActionMenu({
  isOpen,
  onClose,
  onUploadFile,
  onCreateFolder,
}: NewActionMenuProps): React.ReactElement {
  useEffect(() => {
    if (!isOpen) {
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

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close new menu"
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-action-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <h3
              id="new-action-title"
              className="text-base font-semibold text-vaultly-ink md:text-lg lg:text-xl"
            >
              Create new
            </h3>
            <p className="mt-1 text-sm text-gray-700">
              Upload a file or create a folder in your vault.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadFile();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-vaultly-border bg-white px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vaultly-accent-soft text-vaultly-accent">
                  <UploadCloudIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
                </span>
                <span>
                  <span className="block text-sm md:text-base lg:text-lg font-semibold text-vaultly-ink">Upload file</span>
                  <span className="block text-xs md:text-sm lg:text-base text-gray-700">Add files from your device</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateFolder();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-vaultly-border bg-white px-4 py-3 text-left transition-colors hover:bg-gray-100 hover:border-gray-300"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vaultly-blue-soft text-vaultly-blue">
                  <FolderIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
                </span>
                <span>
                  <span className="block text-sm md:text-base lg:text-lg font-semibold text-vaultly-ink">New folder</span>
                  <span className="block text-xs md:text-sm lg:text-base text-gray-700">Organize files in a folder</span>
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

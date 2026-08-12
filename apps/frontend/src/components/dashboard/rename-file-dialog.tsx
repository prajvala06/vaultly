'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

type RenameFileDialogProps = {
  isOpen: boolean;
  currentName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

function selectFileBaseName(input: HTMLInputElement): void {
  const value: string = input.value;
  const lastDot: number = value.lastIndexOf('.');
  if (lastDot > 0) {
    input.setSelectionRange(0, lastDot);
    return;
  }
  input.select();
}

export function RenameFileDialog({
  isOpen,
  currentName,
  isSubmitting,
  onClose,
  onSubmit,
}: RenameFileDialogProps): React.ReactElement {
  const [fileName, setFileName] = useState<string>(currentName);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFileName(currentName);
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isSubmitting) {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, currentName, isSubmitting, onClose]);

  async function handleRename(): Promise<void> {
    const name: string = fileName.trim();
    if (!name) {
      return;
    }
    await onSubmit(name);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close rename dialog"
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={isSubmitting ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-file-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="rename-file-title"
                  className="text-base font-semibold text-vaultly-ink md:text-lg lg:text-xl"
                >
                  Rename file
                </h3>
                <p className="mt-1 text-sm text-gray-700">Choose a new name for this file.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <CloseIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>
            <input
              type="text"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="File name"
              maxLength={255}
              autoFocus
              disabled={isSubmitting}
              onFocus={(event) => selectFileBaseName(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleRename();
                }
              }}
              className="w-full rounded-xl border border-gray-400 bg-white px-3 py-4 text-sm text-vaultly-ink outline-none transition-colors focus:border-gray-500 md:text-base lg:text-lg"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting || fileName.trim().length === 0}
                onClick={() => {
                  void handleRename();
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

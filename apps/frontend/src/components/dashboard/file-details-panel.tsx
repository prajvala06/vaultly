'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import {
  FilesIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  RenameIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { FileTypeIcon, VisibilityBadge, getFileTypeTone } from '@/components/ui/badges';
import type { VaultFile } from '@/lib/vault-file';
import { SharePopover } from '@/components/dashboard/share-popover';

type FileDetailsPanelProps = {
  file: VaultFile | null;
  isOpen: boolean;
  isShareOpen: boolean;
  isDeleting?: boolean;
  isTrashView?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onToggleShare: () => void;
  onCloseShare: () => void;
  onDownload: () => void;
  onRestore?: () => void;
  onDelete: () => void;
};

export function FileDetailsPanel({
  file,
  isOpen,
  isShareOpen,
  isDeleting = false,
  isTrashView = false,
  readOnly = false,
  onClose,
  onToggleShare,
  onCloseShare,
  onDownload,
  onRestore,
  onDelete,
}: FileDetailsPanelProps): React.ReactElement {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isShareOpen && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isShareOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && file ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close details overlay"
            className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={isDeleting ? undefined : onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-details-title"
            className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
          >
            <div className="flex items-center justify-between border-b border-vaultly-border px-5 py-4">
              <h2 id="file-details-title" className="text-sm md:text-base lg:text-lg font-semibold text-vaultly-ink">
                File preview
              </h2>
              <button
                type="button"
                aria-label="Close details"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-full p-1.5 cursor-pointer text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
              >
                <CloseIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>
            <motion.div
              key={file.id}
              className="flex flex-1 flex-col gap-5 overflow-y-auto p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.05 }}
            >
              <div className="rounded-3xl bg-gray-100 p-6 text-center">
                <span
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${getFileTypeTone(file.type).wrap}`}
                >
                  <FileTypeIcon type={file.type} className="h-8 w-8" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-vaultly-ink">{file.name}</h3>
                <p className="mt-1 text-sm text-vaultly-muted">
                  {file.sizeLabel} · {file.mimeLabel}
                </p>
              </div>
              <div className="space-y-3 rounded-3xl border border-gray-300 bg-gray-100 p-4">
                <MetaRow label="Owner">
                  <span className="text-sm text-vaultly-ink-soft">{file.owner}</span>
                </MetaRow>
                <MetaRow label="Visibility">
                  <VisibilityBadge visibility={file.visibility} />
                </MetaRow>
                <MetaRow label="Uploaded">
                  <span className="text-sm text-gray-600">{file.uploadedAt}</span>
                </MetaRow>
                <MetaRow label="Last modified">
                  <span className="text-sm text-vaultly-ink-soft">{file.modifiedAt}</span>
                </MetaRow>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={onDownload} disabled={isDeleting}>
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </Button>
                {isTrashView ? (
                  <>
                    <Button variant="secondary" onClick={onRestore} disabled={isDeleting}>
                      <FilesIcon className="h-4 w-4" />
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      className="col-span-2"
                      onClick={onDelete}
                      disabled={isDeleting}
                    >
                      <TrashIcon className="h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete forever'}
                    </Button>
                  </>
                ) : null}
                {!readOnly && !isTrashView ? (
                  <>
                    <Button variant="secondary" onClick={onToggleShare} disabled={isDeleting}>
                      <ShareIcon className="h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="secondary" disabled={isDeleting}>
                      <RenameIcon className="h-4 w-4" />
                      Rename
                    </Button>
                    <Button variant="danger" onClick={onDelete} disabled={isDeleting}>
                      <TrashIcon className="h-4 w-4" />
                      {isDeleting ? 'Moving...' : 'Move to trash'}
                    </Button>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(file.id);
                }}
                className="inline-flex items-center justify-center gap-2 text-xs text-vaultly-muted transition-colors hover:text-vaultly-accent"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                Copy file ID
              </button>
            </motion.div>
          </motion.aside>
          <SharePopover
            isOpen={isShareOpen}
            fileName={file.name}
            fileId={file.id}
            visibility={file.visibility}
            onClose={onCloseShare}
          />
        </div>
      ) : null}
    </AnimatePresence>
  );
}

type MetaRowProps = {
  label: string;
  children: React.ReactNode;
};

function MetaRow({ label, children }: MetaRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs md:text-sm font-medium text-gray-600">{label}</span>
      {children}
    </div>
  );
}

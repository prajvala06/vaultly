'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SharedFileDto } from '@vaultly/shared';
import { DownloadIcon } from '@/components/icons';
import { FileTypeIcon, getFileTypeTone } from '@/components/ui/badges';
import { Button } from '@/components/ui/button';
import {
  ApiClientError,
  apiRequest,
  downloadVaultFile,
  getFileContentUrl,
} from '@/lib/api-client';
import {
  getUserInitials,
  readAuthSession,
  type AuthSessionUser,
} from '@/lib/auth-session';

type ShareFileViewProps = {
  fileId: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; file: SharedFileDto; previewUrl: string | null }
  | { status: 'signin' }
  | { status: 'forbidden' }
  | { status: 'missing' }
  | { status: 'error'; message: string };

function isVideoFile(file: SharedFileDto): boolean {
  const mime: string = (file.mimeLabel || '').toLowerCase();
  if (mime.includes('video')) {
    return true;
  }
  const name: string = (file.name || '').toLowerCase();
  return (
    name.endsWith('.mp4') ||
    name.endsWith('.mov') ||
    name.endsWith('.webm') ||
    name.endsWith('.mkv') ||
    name.endsWith('.m4v')
  );
}

function canPreviewFile(file: SharedFileDto): boolean {
  return file.type === 'image' || file.type === 'pdf' || isVideoFile(file);
}

function buildLandingAuthHref(mode: 'login' | 'register', fileId: string): string {
  const nextPath: string = encodeURIComponent(`/share/${fileId}`);
  return `/?auth=${mode}&next=${nextPath}`;
}

export function ShareFileView({
  fileId,
}: ShareFileViewProps): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const loginHref: string = buildLandingAuthHref('login', fileId);
  const isSignedIn: boolean = user !== null;

  function openLandingAuth(mode: 'login' | 'register'): void {
    router.push(buildLandingAuthHref(mode, fileId));
  }

  useEffect(() => {
    setUser(readAuthSession());
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadFile(): Promise<void> {
      try {
        const file = await apiRequest<SharedFileDto>(
          `/api/files/${fileId}/shared`,
          {
            skipAuthRedirect: true,
          },
        );

        let previewUrl: string | null = null;

        if (canPreviewFile(file)) {
          const response = await fetch(getFileContentUrl(fileId), {
            credentials: 'include',
          });

          if (response.ok) {
            const blob = await response.blob();
            const typedBlob =
              file.type === 'pdf'
                ? new Blob([blob], { type: 'application/pdf' })
                : isVideoFile(file) && !blob.type.startsWith('video/')
                  ? new Blob([blob], { type: 'video/mp4' })
                  : blob;

            previewUrl = URL.createObjectURL(typedBlob);
            previewUrlRef.current = previewUrl;
          }
        }

        if (!isCancelled) {
          setState({
            status: 'ready',
            file,
            previewUrl,
          });
        } else if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        if (isCancelled) return;

        if (
          error instanceof ApiClientError &&
          error.code === 'UNAUTHENTICATED'
        ) {
          setState({ status: 'signin' });
          return;
        }

        if (
          error instanceof ApiClientError &&
          error.code === 'FILE_FORBIDDEN'
        ) {
          setState({ status: 'forbidden' });
          return;
        }

        if (
          error instanceof ApiClientError &&
          error.code === 'FILE_NOT_FOUND'
        ) {
          setState({ status: 'missing' });
          return;
        }

        setState({
          status: 'error',
          message:
            error instanceof ApiClientError
              ? error.message
              : 'Could not open this file.',
        });
      }
    }

    void loadFile();

    return () => {
      isCancelled = true;

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [fileId]);

  return (
    <div className="min-h-screen bg-white text-[#37352f]">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 h-20 border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="mx-auto flex h-full items-center justify-between px-4 sm:px-6 ">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
          >
            <div className="flex items-center gap-3 px-5 py-5">
              <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
              <span className="text-lg md:text-xl lg:text-2xl font-semibold uppercase tracking-tight">Vaultly</span>
            </div>
          </Link>

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="rounded-md border border-vaultly-ink bg-white px-5 py-3 text-lg font-semibold text-vaultly-ink transition-colors hover:bg-vaultly-surface-muted"
              >
                My Vault
              </Link>
              <Link
                href="/home"
                aria-label="Open vault"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-xs font-bold text-white"
              >
                {getUserInitials(user)}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => openLandingAuth('login')}
                className="rounded-md border border-vaultly-ink bg-white px-5 py-3 text-lg font-semibold text-vaultly-ink transition-colors hover:bg-vaultly-surface-muted"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => openLandingAuth('register')}
                className="rounded-md bg-vaultly-ink px-5 py-3 text-lg font-semibold text-white transition-colors hover:bg-vaultly-ink/80"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full px-4 py-8 sm:px-6 sm:py-10">
        {state.status === 'loading' ? (
          <LoadingState />
        ) : null}

        {state.status === 'signin' ? (
          <AccessCard
            icon="🔐"
            title="Sign in to view this file"
            message="This file is private. Sign in to open it in Vaultly."
            actionHref={loginHref}
            actionLabel="Sign in"
          />
        ) : null}

        {state.status === 'forbidden' ? (
          <AccessCard
            icon="🔒"
            title="This file is private"
            message="You don't have permission to view this file."
            actionHref="/"
            actionLabel="Go home"
          />
        ) : null}

        {state.status === 'missing' ? (
          <AccessCard
            icon="📄"
            title="File not found"
            message="This share link is invalid or the file has been removed."
            actionHref="/"
            actionLabel="Go home"
          />
        ) : null}

        {state.status === 'error' ? (
          <AccessCard
            icon="⚠️"
            title="Could not open file"
            message={state.message}
            actionHref="/"
            actionLabel="Go home"
          />
        ) : null}

        {state.status === 'ready' ? (
          <ShareFileContent state={state} />
        ) : null}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Share file content                                                         */
/* -------------------------------------------------------------------------- */

function ShareFileContent({
  state,
}: {
  state: Extract<LoadState, { status: 'ready' }>;
}): React.ReactElement {
  const { file, previewUrl } = state;

  return (
    <article>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[#9b9a97]">
        <Link
          href="/"
          className="transition-colors hover:text-[#37352f]"
        >
          Vaultly
        </Link>

        <span>/</span>

        <span className="truncate text-[#6b6b67]">
          Shared file
        </span>
      </div>

      {/* File header */}
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getFileTypeTone(file.type).wrap}`}
          >
            <FileTypeIcon
              type={file.type}
              className="h-5 w-5"
            />
          </span>

          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold tracking-[-0.02em] text-[#37352f] ">
              {file.name}
            </h1>

            <p className="mt-1 text-[13px] text-[#9b9a97]">
              Shared by{' '}
              <span className="text-[#6b6b67]">
                {file.owner}
              </span>

              <span className="mx-1.5">·</span>

              {file.sizeLabel}

              <span className="mx-1.5">·</span>

              {file.mimeLabel}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          className=" shrink-0 rounded-md px-3 text-[13px] shadow-none py-2"
          onClick={() => {
            void downloadVaultFile(
              file.id,
              file.name,
            );
          }}
        >
          <DownloadIcon className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-lg border border-[#e3e3e0] bg-white">
        <div className="flex min-h-[500px] items-center justify-center bg-[#f7f7f5]">
          {file.type === 'image' && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-[75vh] max-w-full rounded-md object-contain shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            />
          ) : null}

          {isVideoFile(file) && previewUrl ? (
            <video
              src={previewUrl}
              controls
              playsInline
              className="w-full g-black shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              Your browser does not support video playback.
            </video>
          ) : null}

          {file.type === 'pdf' && previewUrl ? (
            <iframe
              title={file.name}
              src={previewUrl}
              className="h-[75vh] min-h-[500px] w-full rounded-md border border-[#e3e3e0] bg-white"
            />
          ) : null}

          {canPreviewFile(file) && !previewUrl ? (
            <EmptyPreview
              title="Preview unavailable"
              message="The file could not be previewed. Download it to open the original file."
            />
          ) : null}

          {!canPreviewFile(file) ? (
            <EmptyPreview
              title="No preview available"
              message="This file type can't be previewed in the browser."
              showDownload
            />
          ) : null}
        </div>
      </div>

      {/* Footer information */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[#9b9a97]">
        <span>
          Shared securely with Vaultly
        </span>

        <span>
          {file.mimeLabel}
        </span>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function LoadingState(): React.ReactElement {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 md:h-6 md:w-6 lg:h-10 lg:w-10 animate-spin rounded-full border-4 border-[#e3e3e0] border-t-[#37352f]" />

        <p className="text-sm md:text-base lg:text-lg text-[#9b9a97]">
          Opening file...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty preview                                                              */
/* -------------------------------------------------------------------------- */

function EmptyPreview({
  title,
  message,
  showDownload = false,
}: {
  title: string;
  message: string;
  showDownload?: boolean;
}): React.ReactElement {
  return (
    <div className="flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[#e3e3e0] bg-white text-xl">
        📄
      </div>

      <h2 className="text-sm font-semibold text-[#37352f]">
        {title}
      </h2>

      <p className="mt-1.5 text-[13px] leading-5 text-[#9b9a97]">
        {message}
      </p>

      {showDownload ? (
        <p className="mt-4 text-xs text-[#b1b0ac]">
          Use the Download button above.
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Access card                                                                */
/* -------------------------------------------------------------------------- */

type AccessCardProps = {
  icon: string;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
};

function AccessCard({
  icon,
  title,
  message,
  actionHref,
  actionLabel,
}: AccessCardProps): React.ReactElement {
  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="w-full bg-white px-6 py-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 items-center justify-center text-2xl md:text-4xl lg:text-6xl">
          {icon}
        </div>

        <h1 className="text-lg md:text-xl lg:text-2xl font-semibold tracking-[-0.01em] text-[#37352f]">
          {title}
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm md:text-base lg:text-lg leading-5 text-gray-700">
          {message}
        </p>

        <Link
          href={actionHref}
          className="mt-6 inline-flex h-10 items-center rounded-md bg-vaultly-ink px-4 text-sm md:text-base lg:text-lg font-medium text-white transition-colors hover:bg-vaultly-ink/80"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
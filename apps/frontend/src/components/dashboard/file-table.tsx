import { MoreIcon, PlusIcon } from '@/components/icons';
import { FileTypeIcon, VisibilityBadge, getFileTypeTone } from '@/components/ui/badges';
import type { VaultFile } from '@/lib/vault-file';
import Image from 'next/image';
import { Button } from '../ui/button';
import { getFileContentUrl } from '@/lib/api-client';
import type { VaultFolderDto } from '@vaultly/shared';

function isVideoFile(file: VaultFile): boolean {
  const mime = (file.mimeLabel || '').toLowerCase();
  if (mime.includes('video')) return true;
  const name = (file.name || '').toLowerCase();
  return name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.webm') || name.endsWith('.mkv');
}

type FileTableProps = {
  files: readonly VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUploadClick: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  showUploadAction?: boolean;
  folders?: readonly VaultFolderDto[];
  onSelectFolder?: (folderId: string) => void;
};

export function FileTable({
  files,
  selectedFileId,
  onSelectFile,
  onUploadClick,
  emptyTitle = 'No files yet',
  emptyMessage = 'Upload your first file to get started.',
  showUploadAction = true,
  folders = [],
  onSelectFolder,
}: FileTableProps): React.ReactElement {
  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-vaultly-border bg-white px-6 py-16 text-center shadow-vaultly">
        <Image
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnIngcfrKBeDgxUOATcvIMseCRJyYA8XQ8Blbh-9sx0nT4x6hDJDX7ziY&s=10"
          width={140}
          height={140}
          alt={emptyTitle}
        />
        <h3 className="text-2xl font-semibold text-vaultly-ink">{emptyTitle}</h3>
        <p className="mt-1 text-lg text-vaultly-muted">{emptyMessage}</p>
        {showUploadAction ? (
          <Button
            variant="primary"
            onClick={() => onUploadClick()}
            className="mt-4 rounded-full px-5"
          >
            <PlusIcon className="h-4 w-4" />
            Upload
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-vaultly">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-gray-300 bg-gray-800 text-xs font-semibold tracking-wide text-white uppercase">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Name</th>
              <th className="px-4 py-3.5 font-semibold">Owner</th>
              <th className="px-4 py-3.5 font-semibold">Size</th>
              <th className="px-4 py-3.5 font-semibold">Visibility</th>
              <th className="px-4 py-3.5 font-semibold">Modified</th>

            </tr>
          </thead>
          <tbody>
            {folders.map((folder) => (
              <tr
                key={folder.id}
                onClick={() => onSelectFolder?.(folder.id)}
                className="cursor-pointer border-b border-gray-300 transition-colors last:border-b-0 hover:bg-gray-100 bg-orange-50/20"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vaultly-teal-soft">
                      <Image
                        src="https://img.icons8.com/?size=512&id=oiCA327R8ADq&format=png"
                        alt={folder.name}
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                    </span>
                    <span className="font-semibold text-vaultly-ink">{folder.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-vaultly-ink-soft">-</td>
                <td className="px-4 py-3.5 text-vaultly-ink-soft">
                  {folder.fileCount === 1 ? '1 file' : `${folder.fileCount} files`}
                </td>
                <td className="px-4 py-3.5 text-vaultly-ink-soft">-</td>
                <td className="px-4 py-3.5 text-vaultly-ink-soft">-</td>
              </tr>
            ))}
            {files.map((file) => {
              const isSelected: boolean = file.id === selectedFileId;
              const tone = getFileTypeTone(file.type);
              const showPreview = file.type === 'image' || isVideoFile(file);
              return (
                <tr
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={
                    isSelected
                      ? 'cursor-pointer border-b border-gray-300 bg-gray-100 last:border-b-0'
                      : 'cursor-pointer border-b border-gray-300 transition-colors last:border-b-0 hover:bg-gray-100'
                  }
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {showPreview ? (
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-200">
                          {file.type === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getFileContentUrl(file.id)}
                              alt={file.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              crossOrigin="use-credentials"
                            />
                          ) : isVideoFile(file) ? (
                            <>
                              <video
                                src={getFileContentUrl(file.id)}
                                className="h-full w-full object-cover"
                                preload="metadata"
                                crossOrigin="use-credentials"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.wrap}`}
                        >
                          <FileTypeIcon type={file.type} className="h-5 w-5" />
                        </span>
                      )}
                      <span className="font-semibold text-vaultly-ink">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.owner}</td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.sizeLabel}</td>
                  <td className="px-4 py-3.5">
                    <VisibilityBadge visibility={file.visibility} />
                  </td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.modifiedLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

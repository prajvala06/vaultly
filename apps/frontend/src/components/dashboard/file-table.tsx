import { MoreIcon, PlusIcon } from '@/components/icons';
import { FileTypeIcon, VisibilityBadge, getFileTypeTone } from '@/components/ui/badges';
import type { VaultFile } from '@/lib/vault-file';
import Image from 'next/image';
import { Button } from '../ui/button';

type FileTableProps = {
  files: readonly VaultFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUploadClick: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  showUploadAction?: boolean;
};

export function FileTable({
  files,
  selectedFileId,
  onSelectFile,
  onUploadClick,
  emptyTitle = 'No files yet',
  emptyMessage = 'Upload your first file to get started.',
  showUploadAction = true,
}: FileTableProps): React.ReactElement {
  if (files.length === 0) {
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
    <div className="overflow-hidden rounded-3xl border border-gray-300 bg-white shadow-vaultly">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-gray-300 bg-gray-800 text-xs font-semibold tracking-wide text-white uppercase">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Name</th>
              <th className="px-4 py-3.5 font-semibold">Owner</th>
              <th className="px-4 py-3.5 font-semibold">Size</th>
              <th className="px-4 py-3.5 font-semibold">Visibility</th>
              <th className="px-4 py-3.5 font-semibold">Modified</th>
              <th className="px-4 py-3.5 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const isSelected: boolean = file.id === selectedFileId;
              const tone = getFileTypeTone(file.type);
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
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${tone.wrap}`}
                      >
                        <FileTypeIcon type={file.type} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="font-semibold text-vaultly-ink">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.owner}</td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.sizeLabel}</td>
                  <td className="px-4 py-3.5">
                    <VisibilityBadge visibility={file.visibility} />
                  </td>
                  <td className="px-4 py-3.5 text-vaultly-ink-soft">{file.modifiedLabel}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      aria-label={`Actions for ${file.name}`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-full p-1.5 text-vaultly-muted transition-colors hover:bg-vaultly-accent-soft hover:text-vaultly-accent"
                    >
                      <MoreIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

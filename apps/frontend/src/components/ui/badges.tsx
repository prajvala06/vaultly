import type { FileType, FileVisibility } from '@/lib/vault-file';
import { PdfFileIcon, ZipFileIcon, FilesIcon } from '@/components/icons';

type VisibilityBadgeProps = {
  visibility: FileVisibility;
};

export function VisibilityBadge({ visibility }: VisibilityBadgeProps): React.ReactElement {
  if (visibility === 'PUBLIC') {
    return (
      <span className="inline-flex items-center rounded-full bg-vaultly-teal-soft px-2.5 py-1 text-xs font-semibold text-vaultly-teal">
        Public
      </span>
    );
  }
  if (visibility === 'LINK') {
    return (
      <span className="inline-flex items-center rounded-full bg-vaultly-blue-soft px-2.5 py-1 text-xs font-semibold text-vaultly-blue">
        Public
      </span>
    );
  }
  if (visibility === 'SHARED') {
    return (
      <span className="inline-flex items-center rounded-full bg-vaultly-pink-soft px-2.5 py-1 text-xs font-semibold text-vaultly-pink">
        Public
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-vaultly-purple-soft px-2.5 py-1 text-xs font-semibold text-vaultly-purple">
      Private
    </span>
  );
}

type FileTypeIconProps = {
  type: FileType;
  className?: string;
};

export function FileTypeIcon({
  type,
  className = 'h-4 w-4',
}: FileTypeIconProps): React.ReactElement {
  if (type === 'pdf') {
    return <PdfFileIcon className={className} />;
  }
  if (type === 'zip') {
    return <ZipFileIcon className={className} />;
  }
  return <FilesIcon className={className} />;
}

type FileTypeTone = {
  wrap: string;
  icon: string;
};

export function getFileTypeTone(type: FileType): FileTypeTone {
  if (type === 'pdf') {
    return {
      wrap: 'bg-vaultly-blue-soft text-vaultly-blue',
      icon: 'text-vaultly-blue',
    };
  }
  if (type === 'zip') {
    return {
      wrap: 'bg-vaultly-purple-soft text-vaultly-purple',
      icon: 'text-vaultly-purple',
    };
  }
  return {
    wrap: 'bg-vaultly-pink-soft text-vaultly-pink',
    icon: 'text-vaultly-pink',
  };
}

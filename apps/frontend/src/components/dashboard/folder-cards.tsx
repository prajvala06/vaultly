import { FolderIcon } from '@/components/icons';
import type { VaultFolderDto } from '@vaultly/shared';
import type { VaultFile } from '@/lib/vault-file';
import Image from 'next/image';

type FolderCardsProps = {
  files: readonly VaultFile[];
  customFolders?: readonly VaultFolderDto[];
  activeFolderId?: string;
  onFolderSelect?: (folderId: string) => void;
};

type FolderCard = {
  id: string;
  name: string;
  count: number;
  softClassName: string;
  iconClassName: string;
};

function formatFileCount(count: number): string {
  return count === 1 ? '1 file' : `${count} files`;
}

function buildFolders(
  files: readonly VaultFile[],
  customFolders: readonly VaultFolderDto[],
): readonly FolderCard[] {
  const userFolders: readonly FolderCard[] = customFolders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    count: folder.fileCount,
    softClassName: 'bg-vaultly-teal-soft',
    iconClassName: 'text-vaultly-teal',
  }));
  return userFolders;
}

export function FolderCards({
  files,
  customFolders = [],
  activeFolderId = 'all',
  onFolderSelect,
}: FolderCardsProps): React.ReactElement {
  const folders: readonly FolderCard[] = buildFolders(files, customFolders);
  return (
    <section>
      <div className="flex flex-wrap gap-10">
        {folders.map((folder) => {
          const isActive: boolean = folder.id === activeFolderId;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onFolderSelect?.(folder.id)}
              className={`flex flex-col items-center justify-center transition-transform cursor-pointer group
                }`}
            >
              <Image
                src={isActive ? 'https://img.icons8.com/?size=512&id=iKH4vORIVfyI&format=png' : 'https://img.icons8.com/?size=512&id=oiCA327R8ADq&format=png'}
                alt={folder.name}
                width={40}
                height={40}
                className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 md:w-20 md:h-20 lg:w-30 lg:h-30 object-cover"
              />
              <p className="text-sm md:text-base lg:text-lg font-semibold text-vaultly-ink">{folder.name} 
                <span className="text-xs md:text-sm lg:text-base font-normal text-vaultly-muted ml-2">({folder.count})</span>
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

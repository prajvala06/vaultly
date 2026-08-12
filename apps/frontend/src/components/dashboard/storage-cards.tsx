import {
  FilesIcon,
  ShareIcon,
  VaultLogoIcon,
} from '@/components/icons';
import type {
  StorageSummaryDto,
  VaultFile,
} from '@/lib/vault-file';

type StorageCardsProps = {
  files: readonly VaultFile[];
  storage: StorageSummaryDto;
};

type CategoryCard = {
  label: string;
  value: string;
  hint: string;
  progress: number;
  softClassName: string;
  accentClassName: string;
  icon: React.ReactNode;
};

const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units: readonly string[] = [
    'KB',
    'MB',
    'GB',
    'TB',
  ];

  let value: number = bytes;
  let unitIndex = -1;

  while (
    value >= 1024 &&
    unitIndex < units.length - 1
  ) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded: string =
    value >= 10 || unitIndex <= 0
      ? value.toFixed(0)
      : value.toFixed(1);

  return `${rounded} ${units[unitIndex]}`;
}

function buildCategories(
  files: readonly VaultFile[],
  storage: StorageSummaryDto,
): readonly CategoryCard[] {
  const documents = files.filter(
    (file) =>
      file.type === 'pdf' ||
      file.type === 'doc',
  );

  const archives = files.filter(
    (file) => file.type === 'zip',
  );

  const shared = files.filter(
    (file) =>
      file.visibility === 'PUBLIC' ||
      file.visibility === 'SHARED' ||
      file.visibility === 'LINK',
  );

  const documentBytes = documents.reduce(
    (sum, file) => sum + file.sizeBytes,
    0,
  );

  const archiveBytes = archives.reduce(
    (sum, file) => sum + file.sizeBytes,
    0,
  );

  const sharedBytes = shared.reduce(
    (sum, file) => sum + file.sizeBytes,
    0,
  );

  /*
   * Vaultly storage is limited to 1 GB.
   *
   * Even if the backend returns a larger quota,
   * the UI will never show a quota greater than 1 GB.
   */
  const quota = Math.min(
    Math.max(storage.quotaBytes, 1),
    MAX_STORAGE_BYTES,
  );

  return [
    {
      label: 'Documents',
      value: `${documents.length} files`,
      hint: `${formatBytes(documentBytes)} used`,
      progress: Math.min(
        100,
        Math.round(
          (documentBytes / quota) * 100,
        ),
      ),
      softClassName: 'bg-vaultly-blue-soft',
      accentClassName: 'bg-vaultly-blue',
      icon: (
        <FilesIcon className="h-5 w-5 text-vaultly-blue" />
      ),
    },

    {
      label: 'Archives',
      value: `${archives.length} files`,
      hint: `${formatBytes(archiveBytes)} used`,
      progress: Math.min(
        100,
        Math.round(
          (archiveBytes / quota) * 100,
        ),
      ),
      softClassName: 'bg-vaultly-pink-soft',
      accentClassName: 'bg-vaultly-pink',
      icon: (
        <VaultLogoIcon className="h-5 w-5 text-vaultly-pink" />
      ),
    },

    {
      label: 'Shared',
      value: `${shared.length} files`,
      hint: `${formatBytes(sharedBytes)} used`,
      progress: Math.min(
        100,
        Math.round(
          (sharedBytes / quota) * 100,
        ),
      ),
      softClassName: 'bg-vaultly-purple-soft',
      accentClassName: 'bg-vaultly-purple',
      icon: (
        <ShareIcon className="h-5 w-5 text-vaultly-purple" />
      ),
    },
  ];
}

export function StorageCards({
  files,
  storage,
}: StorageCardsProps): React.ReactElement {
  const categories = buildCategories(
    files,
    storage,
  );

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {categories.map((category) => (
        <article
          key={category.label}
          className={`
            h-42
            cursor-pointer
            rounded-3xl
            ${category.softClassName}
            px-5
            py-4
            shadow-vaultly
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:shadow-vaultly-hover
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm">
                {category.icon}
              </span>

              <h3 className="text-lg font-semibold tracking-tight text-vaultly-ink">
                {category.label}
              </h3>
            </div>

            <button
              type="button"
              className="cursor-pointer text-xs font-semibold text-vaultly-ink-soft transition-colors hover:text-vaultly-ink"
            >
              View
            </button>
          </div>

          <p className="mt-4 pl-4 text-sm text-vaultly-ink-soft">
            {category.value}
          </p>

          <div className="ml-4 mt-4 h-1.5 overflow-hidden rounded-full bg-white/70">
            <div
              className={`
                h-full
                rounded-full
                ${category.accentClassName}
                transition-all
                duration-500
              `}
              style={{
                width: `${category.progress}%`,
              }}
            />
          </div>

          <p className="mt-2 pl-4 text-xs font-medium text-vaultly-muted">
            {category.hint}
          </p>
        </article>
      ))}
    </section>
  );
}
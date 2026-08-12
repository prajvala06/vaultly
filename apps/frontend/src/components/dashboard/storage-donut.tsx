'use client';

import type { StorageSummaryDto } from '@vaultly/shared';
import type { VaultFile } from '@/lib/vault-file';

type StorageBreakdownItem = {
  label: string;
  bytes: number;
  count: number;
  color: string;
};

const MIN_USED_SLICE_DEGREES = 10;
const MIN_BAR_PERCENT = 6;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units: readonly string[] = ['KB', 'MB', 'GB', 'TB'];
  let value: number = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  if (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  if (value < 1) {
    const floored: number = Math.floor(value * 100) / 100;
    return `${floored.toFixed(2)} ${units[unitIndex]}`;
  }
  const rounded: string = value >= 10 || unitIndex <= 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function formatUsagePercent(bytes: number, totalBytes: number): string {
  if (bytes <= 0 || totalBytes <= 0) {
    return '0%';
  }
  const percent: number = (bytes / totalBytes) * 100;
  if (percent < 0.1) {
    return '<0.1%';
  }
  if (percent < 1) {
    return `${percent.toFixed(1)}%`;
  }
  return `${Math.round(percent)}%`;
}

function getBarWidthPercent(bytes: number, totalBytes: number): number {
  if (bytes <= 0 || totalBytes <= 0) {
    return 0;
  }
  const percent: number = (bytes / totalBytes) * 100;
  return Math.min(100, Math.max(MIN_BAR_PERCENT, percent));
}

function buildDonutGradient(
  breakdown: readonly StorageBreakdownItem[],
  totalBytes: number,
): string {
  const usedItems: readonly StorageBreakdownItem[] = breakdown.filter(
    (item) => item.label !== 'Free space' && item.bytes > 0,
  );
  const freeItem: StorageBreakdownItem | undefined = breakdown.find(
    (item) => item.label === 'Free space',
  );
  if (usedItems.length === 0) {
    return `conic-gradient(${freeItem?.color ?? '#f3e8ff'} 0deg 360deg)`;
  }
  const rawUsedDegrees: number = usedItems.reduce(
    (sum, item) => sum + (item.bytes / totalBytes) * 360,
    0,
  );
  const minUsedDegrees: number = usedItems.length * MIN_USED_SLICE_DEGREES;
  const usedDegrees: number = Math.min(120, Math.max(rawUsedDegrees, minUsedDegrees));
  const usedBytesTotal: number = usedItems.reduce((sum, item) => sum + item.bytes, 0);
  const stops: string[] = [];
  let currentDegree = 0;
  for (const item of usedItems) {
    const share: number = item.bytes / usedBytesTotal;
    const nextDegree: number = currentDegree + share * usedDegrees;
    stops.push(`${item.color} ${currentDegree}deg ${nextDegree}deg`);
    currentDegree = nextDegree;
  }
  stops.push(`${freeItem?.color ?? '#f3e8ff'} ${currentDegree}deg 360deg`);
  return `conic-gradient(${stops.join(', ')})`;
}

function buildStorageBreakdown(
  files: readonly VaultFile[],
  storage: StorageSummaryDto,
): readonly StorageBreakdownItem[] {
  const documents = files.filter((file) => file.type === 'pdf' || file.type === 'doc');
  const images = files.filter((file) => file.type === 'image');
  const archives = files.filter((file) => file.type === 'zip');
  const other = files.filter(
    (file) =>
      file.type !== 'pdf' && file.type !== 'doc' && file.type !== 'image' && file.type !== 'zip',
  );
  const documentBytes: number = documents.reduce((sum, file) => sum + file.sizeBytes, 0);
  const imageBytes: number = images.reduce((sum, file) => sum + file.sizeBytes, 0);
  const archiveBytes: number = archives.reduce((sum, file) => sum + file.sizeBytes, 0);
  const otherBytes: number = other.reduce((sum, file) => sum + file.sizeBytes, 0);
  const freeBytes: number = Math.max(0, storage.quotaBytes - storage.usedBytes);
  return [
    {
      label: 'Documents',
      bytes: documentBytes,
      count: documents.length,
      color: '#3b82f6',
    },
    {
      label: 'Images',
      bytes: imageBytes,
      count: images.length,
      color: '#ec4899',
    },
    {
      label: 'Archives',
      bytes: archiveBytes,
      count: archives.length,
      color: '#8b5cf6',
    },
    {
      label: 'Other',
      bytes: otherBytes,
      count: other.length,
      color: '#f97316',
    },
    {
      label: 'Free space',
      bytes: freeBytes,
      count: 0,
      color: '#f3e8ff',
    },
  ];
}

type StorageDonutProps = {
  files: readonly VaultFile[];
  storage: StorageSummaryDto;
};

export function StorageDonut({ files, storage }: StorageDonutProps): React.ReactElement {
  const breakdown: readonly StorageBreakdownItem[] = buildStorageBreakdown(files, storage);
  const totalBytes: number = Math.max(storage.quotaBytes, 1);
  const usedItems: readonly StorageBreakdownItem[] = breakdown.filter(
    (item) => item.label !== 'Free space',
  );
  const donutBackground: string = buildDonutGradient(breakdown, totalBytes);
  const usedPercentLabel: string = formatUsagePercent(storage.usedBytes, totalBytes);

  return (
    <div className="my-4">
      <h3 className="text-base font-semibold text-vaultly-ink md:text-lg lg:text-2xl">
        Storage details
      </h3>
      <div className="mt-4 rounded-3xl bg-gray-100 p-5">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-evenly lg:gap-12">
          <div className="flex flex-col items-center">
            <div
              className="relative h-48 w-48 rounded-full md:h-52 md:w-52"
              style={{ background: donutBackground }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                <p className="text-lg font-bold text-vaultly-ink md:text-2xl lg:text-3xl">
                  {storage.usedLabel}
                </p>
                <p className="text-sm font-medium text-vaultly-muted md:text-base lg:text-lg">
                  of {storage.quotaLabel}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-vaultly-muted md:text-base lg:text-lg">
              {storage.fileCount} {storage.fileCount === 1 ? 'file' : 'files'} · {usedPercentLabel} used
            </p>
          </div>
          <ul className="grid w-full max-w-md grid-cols-1 gap-3 lg:grid-cols-2">
            {usedItems.map((item) => {
              const percentLabel: string = formatUsagePercent(item.bytes, totalBytes);
              const barWidth: number = getBarWidthPercent(item.bytes, totalBytes);
              return (
                <li
                  key={item.label}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-vaultly-ink">{item.label}</p>
                        <p className="text-xs text-vaultly-muted">
                          {item.count === 1 ? '1 file' : `${item.count} files`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-vaultly-ink">
                        {formatBytes(item.bytes)}
                      </p>
                      <p className="text-xs text-vaultly-muted">{percentLabel}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-vaultly-bg">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
            <li className="rounded-2xl border border-dashed border-violet-200 bg-white/50 px-4 py-3 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#f3e8ff] ring-1 ring-violet-200" />
                  <p className="text-sm font-semibold text-vaultly-ink">Free space</p>
                </div>
                <p className="text-sm font-semibold text-vaultly-ink">
                  {formatBytes(Math.max(0, storage.quotaBytes - storage.usedBytes))}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

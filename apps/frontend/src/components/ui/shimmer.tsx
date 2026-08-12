type ShimmerBlockProps = {
  className?: string;
};

export function ShimmerBlock({ className = '' }: ShimmerBlockProps): React.ReactElement {
  return <span className={`vaultly-shimmer block rounded-full ${className}`} />;
}

type FilesShimmerLoaderProps = {
  viewMode?: 'list' | 'grid';
  rows?: number;
};

export function FilesShimmerLoader({
  viewMode = 'list',
  rows = 6,
}: FilesShimmerLoaderProps): React.ReactElement {
  if (viewMode === 'grid') {
    return (
      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-label="Loading files"
      >
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={`grid-shimmer-${index}`}
            className="rounded-3xl border border-vaultly-border bg-white p-4 shadow-vaultly"
          >
            <ShimmerBlock className="mb-3 h-10 w-10 rounded-full" />
            <ShimmerBlock className="h-4 w-3/4 rounded-lg" />
            <ShimmerBlock className="mt-2 h-3 w-1/2 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border border-vaultly-border bg-white shadow-vaultly"
      aria-busy="true"
      aria-label="Loading files"
    >
      <div className="border-b border-vaultly-border bg-gray-50 px-4 py-3.5">
        <div className="flex gap-8">
          <ShimmerBlock className="h-3 w-16 rounded-md" />
          <ShimmerBlock className="hidden h-3 w-14 rounded-md sm:block" />
          <ShimmerBlock className="hidden h-3 w-12 rounded-md md:block" />
          <ShimmerBlock className="hidden h-3 w-20 rounded-md lg:block" />
          <ShimmerBlock className="hidden h-3 w-16 rounded-md xl:block" />
        </div>
      </div>
      <ul className="divide-y divide-vaultly-border">
        {Array.from({ length: rows }, (_, index) => (
          <li key={`list-shimmer-${index}`} className="flex items-center gap-3 px-4 py-3.5">
            <ShimmerBlock className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmerBlock className="h-3.5 w-[42%] max-w-[220px] rounded-lg" />
              <ShimmerBlock className="h-3 w-[28%] max-w-[140px] rounded-lg sm:hidden" />
            </div>
            <ShimmerBlock className="hidden h-3 w-16 rounded-lg sm:block" />
            <ShimmerBlock className="hidden h-3 w-14 rounded-lg md:block" />
            <ShimmerBlock className="hidden h-6 w-16 rounded-full lg:block" />
            <ShimmerBlock className="hidden h-3 w-16 rounded-lg xl:block" />
            <ShimmerBlock className="h-7 w-7 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

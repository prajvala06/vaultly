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

export function HomeShimmerLoader(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading home">
      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <article
            key={`home-card-shimmer-${index}`}
            className="h-42 rounded-3xl bg-white px-5 py-4 shadow-vaultly"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShimmerBlock className="h-10 w-10 rounded-full" />
                <ShimmerBlock className="h-5 w-24 rounded-lg" />
              </div>
              <ShimmerBlock className="h-3 w-10 rounded-md" />
            </div>
            <ShimmerBlock className="mt-6 ml-4 h-4 w-20 rounded-lg" />
            <ShimmerBlock className="mt-4 ml-4 h-1.5 w-[calc(100%-1rem)] rounded-full" />
            <ShimmerBlock className="mt-3 ml-4 h-3 w-24 rounded-md" />
          </article>
        ))}
      </section>
      <div className="my-4">
        <ShimmerBlock className="h-7 w-40 rounded-lg" />
        <div className="mt-4 rounded-3xl bg-gray-100 p-5">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-evenly lg:gap-12">
            <div className="flex flex-col items-center">
              <ShimmerBlock className="h-48 w-48 rounded-full md:h-52 md:w-52" />
              <ShimmerBlock className="mt-4 h-4 w-40 rounded-lg" />
            </div>
            <ul className="grid w-full max-w-md grid-cols-1 gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <li
                  key={`home-legend-shimmer-${index}`}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShimmerBlock className="h-2.5 w-2.5 rounded-full" />
                      <div className="space-y-2">
                        <ShimmerBlock className="h-3.5 w-20 rounded-md" />
                        <ShimmerBlock className="h-3 w-14 rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ShimmerBlock className="ml-auto h-3.5 w-12 rounded-md" />
                      <ShimmerBlock className="ml-auto h-3 w-8 rounded-md" />
                    </div>
                  </div>
                  <ShimmerBlock className="mt-2.5 h-1.5 w-full rounded-full" />
                </li>
              ))}
              <li className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-4 py-3 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShimmerBlock className="h-2.5 w-2.5 rounded-full" />
                    <ShimmerBlock className="h-3.5 w-24 rounded-md" />
                  </div>
                  <ShimmerBlock className="h-3.5 w-16 rounded-md" />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps): React.ReactElement {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-vaultly-sidebar text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.35),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.28),_transparent_35%),radial-gradient(circle_at_center,_rgba(139,92,246,0.18),_transparent_45%)]" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-vaultly-accent text-white shadow-lg shadow-orange-500/30">
              <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Vaultly</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-sm font-medium text-orange-300">Secure file storage</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white xl:text-5xl">
            Store, manage, and share with confidence.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Upload large files, control private and public access, and keep everything organized in
            one calm, colorful workspace.
          </p>
          <div className="mt-8 grid gap-3">
            <HighlightCard title="Private by default" detail="Owner-only access until you share." />
            <HighlightCard
              title="100 MB+ uploads"
              detail="Progress-aware uploads without freezing UI."
            />
            <HighlightCard
              title="Secure share links"
              detail="Cryptographically random public tokens."
            />
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/40">
          Vaultly · Securely store, manage, and share your files.
        </p>
      </section>
      <section className="flex items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.08),_transparent_35%)] px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-vaultly-accent text-white">
              <Image src="/images/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </span>
            <span className="text-base font-semibold text-vaultly-ink">Vaultly</span>
          </Link>
          <div className="rounded-[28px] border border-vaultly-border bg-white p-6 shadow-vaultly sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-vaultly-ink">{title}</h2>
            <p className="mt-2 text-sm text-vaultly-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

type HighlightCardProps = {
  title: string;
  detail: string;
};

function HighlightCard({ title, detail }: HighlightCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/55">{detail}</p>
    </div>
  );
}

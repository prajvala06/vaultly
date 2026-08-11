export default function Home(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-slate-100">
      <p className="text-sm font-medium tracking-[0.2em] text-teal-400 uppercase">Vaultly</p>
      <h1 className="mt-4 max-w-xl text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        Securely store, manage, and share your files.
      </h1>
      <p className="mt-4 max-w-md text-center text-slate-400">
        Project foundation is ready. Authentication and file storage arrive in upcoming phases.
      </p>
    </main>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/12">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate2">
          CertiTrack — demo registry
        </p>
        <p className="text-xs text-slate2">
          Scheme data is illustrative. Verify certification status with the standard body.
        </p>
      </div>
    </footer>
  );
}

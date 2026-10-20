export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4" role="status">
      <div className="h-8 w-8 animate-spin border-2 border-ink/15 border-t-seal" />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate2">{label}</p>
    </div>
  );
}

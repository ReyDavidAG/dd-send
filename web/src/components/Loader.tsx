export function Loader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <span className="relative grid h-14 w-14 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-line border-t-coral" />
        <span className="text-lg">💌</span>
      </span>
      <p className="text-sm font-medium text-ink/60">{label}</p>
    </div>
  );
}

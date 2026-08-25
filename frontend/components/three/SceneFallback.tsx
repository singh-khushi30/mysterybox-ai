export function SceneFallback({ label = "Preparing the archive" }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink">
      <div className="text-center">
        <p className="font-mono text-[0.65rem] tracking-[0.38em] text-brass/70 uppercase">
          MysteryBox
        </p>
        <p className="mt-4 font-display text-2xl text-beige/80">{label}</p>
        <div className="mx-auto mt-6 h-px w-24 overflow-hidden bg-brass/20">
          <div className="h-full w-1/2 animate-pulse bg-brass/70" />
        </div>
      </div>
    </div>
  );
}

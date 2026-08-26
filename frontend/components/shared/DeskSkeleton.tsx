export function DeskSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-48 bg-brass/10" />
      <div className="h-24 bg-brass/8" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 bg-brass/8" />
        <div className="h-40 bg-brass/8" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading evidence board">
      <div className="h-8 w-64 animate-pulse bg-brass/10" />
      <div className="evidence-board relative min-h-[70vh] overflow-hidden border border-brass/20">
        <div className="absolute top-16 left-10 h-24 w-52 animate-pulse border border-brass/20 bg-[#161310]" />
        <div className="absolute top-48 left-10 h-24 w-52 animate-pulse border border-brass/20 bg-[#161310]" />
        <div className="absolute top-20 left-[22rem] h-20 w-48 animate-pulse border border-brass/25 bg-[#1c1612]" />
        <div className="absolute top-12 right-16 h-28 w-52 rotate-[-2deg] animate-pulse bg-[#e8d7be]/80" />
        <div className="absolute top-48 right-40 h-28 w-52 rotate-[1deg] animate-pulse bg-[#e8d7be]/70" />
      </div>
    </div>
  );
}

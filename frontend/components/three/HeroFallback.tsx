export function HeroFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgb(196_160_106/16%),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgb(255_196_130/18%),transparent_18%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#1a120e] via-[#16110d] to-transparent" />
      <div className="absolute bottom-[18%] left-1/2 h-40 w-[78%] max-w-md -translate-x-1/2 rotate-[-4deg] rounded-sm border border-brass/15 bg-[#9a623d] shadow-[0_24px_60px_rgb(0_0_0/50%)]">
        <div className="absolute top-6 right-6 left-6 h-16 border border-[#3a2418]/20 bg-[#e6d7bf] px-4 py-3">
          <p className="font-mono text-[0.6rem] tracking-[0.28em] text-[#3a2418] uppercase">
            Case 001
          </p>
          <p className="mt-1 font-display text-sm text-[#5c2430]">Blackwood Manor</p>
        </div>
      </div>
      <div className="absolute bottom-[28%] left-[12%] h-24 w-16 rotate-[-18deg] bg-[#c2b094] opacity-70" />
      <div className="absolute right-[14%] bottom-[26%] h-20 w-14 rotate-[14deg] bg-[#d4c2a3] opacity-60" />
    </div>
  );
}

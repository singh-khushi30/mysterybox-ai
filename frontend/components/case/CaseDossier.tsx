"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaseOpeningExperience } from "@/components/three/CaseOpeningExperience";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useViewportMode } from "@/hooks/useViewportMode";
import type { CaseFile } from "@/types/case";

export function CaseDossier({ caseFile }: { caseFile: CaseFile }) {
  const router = useRouter();
  const mode = useViewportMode();
  const reducedMotion = usePrefersReducedMotion();
  const [opening, setOpening] = useState(reducedMotion);
  const [showDossier, setShowDossier] = useState(reducedMotion);

  useEffect(() => {
    const openTimer = window.setTimeout(
      () => setOpening(true),
      reducedMotion ? 0 : 350
    );
    const revealTimer = window.setTimeout(
      () => setShowDossier(true),
      reducedMotion ? 0 : 1100
    );

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(revealTimer);
    };
  }, [reducedMotion]);

  if (caseFile.locked) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center">
        <p className="font-mono text-[0.68rem] tracking-[0.34em] text-brass uppercase">
          Case #{caseFile.number}
        </p>
        <h1 className="mt-4 font-display text-5xl text-paper">{caseFile.title}</h1>
        <p className="mt-4 text-beige/60">This file is sealed. Coming soon.</p>
        <Link
          href="/cases"
          className="mt-8 font-mono text-[0.68rem] tracking-[0.24em] text-brass uppercase"
        >
          Return to the archive
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink">
      <div className="absolute inset-0 opacity-70 md:opacity-100">
        <CaseOpeningExperience
          opening={opening}
          reducedMotion={reducedMotion}
          mode={mode}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20 md:from-ink/90 md:via-ink/55 md:to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-8 md:px-10">
        <Link
          href="/cases"
          className="w-fit font-mono text-[0.62rem] tracking-[0.3em] text-brass/80 uppercase hover:text-brass"
        >
          Return to the archive
        </Link>

        <AnimatePresence>
          {showDossier && (
            <motion.section
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mt-8 grid flex-1 items-start gap-10 pb-10 lg:grid-cols-[0.9fr_1.1fr]"
            >
              <article className="paper-texture max-w-xl rounded-sm p-6 text-[#2d2118] shadow-[0_24px_70px_rgb(0_0_0/45%)] md:p-8">
                <p className="font-mono text-[0.62rem] tracking-[0.28em] uppercase">
                  Case #{caseFile.number}
                </p>
                <h1 className="mt-3 font-display text-4xl leading-tight">
                  {caseFile.title}
                </h1>
                <div className="mt-6 flex items-center gap-4">
                  <Portrait initials={caseFile.victim?.initials ?? "EV"} />
                  <div>
                    <p className="font-display text-xl">{caseFile.victim?.name}</p>
                    <p className="text-sm text-[#5c4636]">{caseFile.victim?.role}</p>
                  </div>
                </div>
                <dl className="mt-6 space-y-2 font-mono text-[0.7rem] tracking-[0.14em] uppercase">
                  <div className="flex justify-between gap-6 border-b border-[#3a2418]/15 py-2">
                    <dt>Location</dt>
                    <dd className="text-right">{caseFile.location}</dd>
                  </div>
                  <div className="flex justify-between gap-6 border-b border-[#3a2418]/15 py-2">
                    <dt>Date</dt>
                    <dd>{caseFile.date}</dd>
                  </div>
                </dl>
                <p className="mt-6 text-[1.02rem] leading-8">{caseFile.summary}</p>
              </article>

              <div className="space-y-8">
                <section>
                  <h2 className="font-mono text-[0.62rem] tracking-[0.3em] text-brass uppercase">
                    Persons of interest
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {caseFile.suspects?.map((suspect) => (
                      <div key={suspect.id} className="text-center">
                        <Portrait initials={suspect.initials} dark />
                        <p className="mt-3 font-display text-lg text-paper">
                          {suspect.name}
                        </p>
                        <p className="text-sm text-beige/50">{suspect.role}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-mono text-[0.62rem] tracking-[0.3em] text-brass uppercase">
                    Evidence labels
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {caseFile.evidence?.map((item) => (
                      <span
                        key={item}
                        className="border border-brass/25 bg-[#e8d7be] px-3 py-1.5 font-mono text-[0.68rem] tracking-[0.16em] text-[#3a2418] uppercase"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <div>
                  <WaxSealButton
                    onClick={() => router.push(`/cases/${caseFile.id}/investigate`)}
                  >
                    Begin Investigation
                  </WaxSealButton>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Portrait({
  initials,
  dark = false,
}: {
  initials: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "mx-auto flex aspect-[3/4] w-full items-center justify-center border border-brass/20 bg-[#1b1612] font-display text-3xl text-brass/80"
          : "flex size-20 items-center justify-center border border-[#3a2418]/20 bg-[#cbb89a] font-display text-2xl"
      }
    >
      {initials}
    </div>
  );
}

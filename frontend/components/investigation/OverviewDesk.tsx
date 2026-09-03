"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Portrait } from "@/components/shared/Portrait";
import { getInvestigationStats } from "@/lib/investigation";
import { useProgressCase } from "@/lib/investigation/progress-context";
import type { Case } from "@/types/investigation";

export function OverviewDesk({ caseFile }: { caseFile: Case }) {
  const liveCase = useProgressCase(caseFile);
  const stats = getInvestigationStats(liveCase);
  const discovered = liveCase.evidence.filter((item) => item.discovered).slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="paper-texture rounded-sm p-6 text-[#2d2118] shadow-[0_18px_50px_rgb(0_0_0/35%)] md:p-8">
          <p className="font-mono text-[0.62rem] tracking-[0.28em] uppercase">
            File {liveCase.number} · {liveCase.date}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight">{liveCase.title}</h2>
          <div className="mt-6 flex items-start gap-4">
            <Portrait initials={liveCase.victim.initials} paper className="size-16 text-2xl" />
            <div>
              <p className="font-display text-xl">{liveCase.victim.name}</p>
              <p className="text-sm text-[#5c4636]">{liveCase.victim.role}</p>
              <p className="mt-3 leading-7">{liveCase.victim.summary}</p>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Difficulty" value={liveCase.difficulty} />
          <Stat label="Progress" value={`${stats.progress}%`} />
          <Stat
            label="Evidence"
            value={`${stats.discovered}/${stats.evidenceTotal}`}
          />
          <Stat
            label="Questioned"
            value={`${stats.questioned}/${stats.suspectTotal}`}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionLabel>Pinned evidence</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {discovered.map((item) => (
              <span
                key={item.id}
                className="border border-brass/25 bg-[#e8d7be] px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-[#3a2418] uppercase"
              >
                {item.fileNumber} · {item.title}
              </span>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Persons of interest</SectionLabel>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {liveCase.suspects.map((suspect) => (
              <Link
                key={suspect.id}
                href={`/cases/${liveCase.id}/investigate/suspects/${suspect.id}`}
                className="text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <Portrait initials={suspect.initials} className="mx-auto aspect-[3/4] w-full text-xl" />
                <p className="mt-2 font-display text-sm text-paper">
                  {suspect.name.replace(/^Dr\.\s+/, "").split(" ")[0]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-brass/15 bg-[#161310]/80 p-4"
    >
      <p className="font-mono text-[0.58rem] tracking-[0.22em] text-beige/45 uppercase">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-paper">{value}</p>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-mono text-[0.62rem] tracking-[0.3em] text-brass uppercase">
      {children}
    </h3>
  );
}

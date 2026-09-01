"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Portrait } from "@/components/shared/Portrait";
import { suspicionLabel } from "@/lib/investigation";
import type { Case, Suspect } from "@/types/investigation";
import { cn } from "@/lib/utils";

export function SuspectGrid({ caseFile }: { caseFile: Case }) {
  if (caseFile.suspects.length === 0) {
    return (
      <p className="font-display text-lg text-beige/50 italic">
        No persons of interest have been named.
      </p>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {caseFile.suspects.map((suspect, index) => (
        <SuspectCard
          key={suspect.id}
          caseId={caseFile.id}
          suspect={suspect}
          delay={index * 0.06}
        />
      ))}
    </div>
  );
}

function SuspectCard({
  caseId,
  suspect,
  delay,
}: {
  caseId: string;
  suspect: Suspect;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="border border-brass/15 bg-[#161310]/75 p-5 shadow-[0_16px_40px_rgb(0_0_0/30%)]"
    >
      <div className="flex gap-4">
        <Portrait initials={suspect.initials} className="h-28 w-20 text-2xl" />
        <div className="min-w-0">
          <p className="font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
            File S-{suspect.initials}
          </p>
          <h2 className="font-display text-2xl text-paper">{suspect.name}</h2>
          <p className="text-sm text-beige/55">{suspect.relationship}</p>
          <p
            className={cn(
              "mt-2 font-mono text-[0.62rem] tracking-[0.16em] uppercase",
              suspect.suspicion === "elevated" ? "text-burgundy" : "text-brass/80"
            )}
          >
            {suspicionLabel(suspect.suspicion)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-beige/75">{suspect.bio}</p>
      <p className="mt-3 border-l border-brass/30 pl-3 text-sm text-beige/60 italic">
        Alibi: {suspect.alibi}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/cases/${caseId}/investigate/suspects/${suspect.id}`}
          className="border border-brass/30 px-4 py-2 font-mono text-[0.62rem] tracking-[0.18em] text-beige uppercase transition-colors hover:border-brass hover:text-paper"
        >
          View Profile
        </Link>
        <Link
          href={`/cases/${caseId}/investigate/interrogate/${suspect.id}`}
          className="border border-burgundy/50 bg-burgundy/70 px-4 py-2 font-mono text-[0.62rem] tracking-[0.18em] text-paper uppercase transition-colors hover:bg-burgundy"
        >
          Interrogate
        </Link>
      </div>
    </motion.article>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { CaseFile } from "@/types/case";
import { cn } from "@/lib/utils";

type ArchiveFolderProps = {
  caseFile: CaseFile;
  featured?: boolean;
};

export function ArchiveFolder({ caseFile, featured = false }: ArchiveFolderProps) {
  const body = (
    <motion.article
      whileHover={caseFile.locked ? { y: -2 } : { y: -8, rotate: featured ? -1.5 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={cn(
        "relative overflow-hidden rounded-sm border shadow-[0_18px_50px_rgb(0_0_0/40%)]",
        featured
          ? "min-h-[340px] border-brass/25 bg-[#9a623d] md:min-h-[420px]"
          : "min-h-[260px] border-white/5 bg-[#6d4330]",
        caseFile.locked && "opacity-70"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-10 bg-[#4a1f28]" />
      <div className="absolute top-14 right-6 left-6 border border-[#3a2418]/25 bg-[#e8d7be] px-4 py-3">
        <p className="font-mono text-[0.62rem] tracking-[0.28em] text-[#3a2418] uppercase">
          Case #{caseFile.number}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-tight text-[#3d2218]">
          {caseFile.title}
        </h2>
      </div>

      {caseFile.locked ? (
        <div className="absolute inset-x-6 bottom-6 flex items-center justify-between text-[#f3eadc]">
          <span className="inline-flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.24em] uppercase">
            <Lock className="size-3.5" />
            Coming Soon
          </span>
        </div>
      ) : (
        <div className="absolute inset-x-6 bottom-6 text-[#f3eadc]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
            <div>
              <dt className="text-paper/50">Difficulty</dt>
              <dd>{caseFile.difficulty}</dd>
            </div>
            <div>
              <dt className="text-paper/50">Time</dt>
              <dd>{caseFile.duration}</dd>
            </div>
            <div>
              <dt className="text-paper/50">Suspects</dt>
              <dd>{caseFile.suspectCount}</dd>
            </div>
            <div>
              <dt className="text-paper/50">Clues</dt>
              <dd>{caseFile.clueCount}</dd>
            </div>
          </dl>
          <p className="mt-6 font-display text-xl tracking-[0.2em] text-brass uppercase">
            Open Case
          </p>
        </div>
      )}
    </motion.article>
  );

  if (caseFile.locked) {
    return (
      <div className="w-full max-w-sm rotate-1 md:max-w-none" aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={`/cases/${caseFile.id}`} className="block w-full max-w-xl md:max-w-none">
      {body}
    </Link>
  );
}

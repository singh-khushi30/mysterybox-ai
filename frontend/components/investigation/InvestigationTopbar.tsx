"use client";

import { motion } from "framer-motion";
import { Portrait } from "@/components/shared/Portrait";

type InvestigationTopbarProps = {
  number: string;
  title: string;
  progress: number;
};

export function InvestigationTopbar({
  number,
  title,
  progress,
}: InvestigationTopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brass/15 pb-4">
      <div>
        <p className="font-mono text-[0.62rem] tracking-[0.32em] text-brass uppercase">
          Case #{number}
        </p>
        <h1 className="mt-1 font-display text-2xl text-paper md:text-3xl">{title}</h1>
      </div>
      <div className="flex items-center gap-5">
        <div className="w-40 md:w-56">
          <div className="mb-1 flex justify-between font-mono text-[0.58rem] tracking-[0.2em] text-beige/50 uppercase">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-[3px] overflow-hidden bg-brass/15">
            <motion.div
              className="h-full bg-brass"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Portrait initials="KV" className="size-9 text-sm" />
          <div className="hidden sm:block">
            <p className="font-display text-sm text-paper">K. Vale</p>
            <p className="font-mono text-[0.58rem] tracking-[0.18em] text-beige/45 uppercase">
              Consulting detective
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

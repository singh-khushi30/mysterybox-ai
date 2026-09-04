"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/context";
import { initialsFromDisplayName } from "@/lib/investigation/profile";
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
  const { profile } = useAuth();
  const name = profile?.displayName ?? "Detective";
  const rank = profile?.detectiveRank ?? "Rookie Detective";
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
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-sm transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:outline-none"
          aria-label="Open detective profile"
        >
          <Portrait initials={initialsFromDisplayName(name)} className="size-9 text-sm" />
          <div className="hidden sm:block">
            <p className="font-display text-sm text-paper">{name}</p>
            <p className="font-mono text-[0.58rem] tracking-[0.18em] text-beige/45 uppercase">
              {rank}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}

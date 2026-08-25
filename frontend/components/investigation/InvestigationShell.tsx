"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { InvestigationNav } from "@/components/investigation/InvestigationNav";
import { InvestigationTopbar } from "@/components/investigation/InvestigationTopbar";
import { getInvestigationStats } from "@/lib/investigation";
import type { Case } from "@/types/investigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function InvestigationShell({
  caseFile,
  children,
}: {
  caseFile: Case;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const stats = getInvestigationStats(caseFile);

  return (
    <div className="desk-blotter min-h-dvh">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(196_160_106/7%),transparent_46%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-6 px-4 py-5 md:px-8 lg:flex-row lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0 lg:py-4">
          <Link
            href={`/cases/${caseFile.id}`}
            className="mb-6 inline-block font-mono text-[0.62rem] tracking-[0.3em] text-brass/80 uppercase hover:text-brass"
          >
            MysteryBox · File
          </Link>
          <p className="mb-4 hidden font-display text-sm text-beige/40 italic lg:block">
            The desk is yours. Do not rush the paper.
          </p>
          <InvestigationNav caseId={caseFile.id} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col pb-10">
          <InvestigationTopbar
            number={caseFile.number}
            title={caseFile.title}
            progress={stats.progress}
          />
          <motion.div
            key={pathname}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8 flex-1"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

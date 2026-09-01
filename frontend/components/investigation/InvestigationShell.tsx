"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { DeskPager } from "@/components/investigation/DeskPager";
import { InvestigationNav } from "@/components/investigation/InvestigationNav";
import { InvestigationTopbar } from "@/components/investigation/InvestigationTopbar";
import { DustMotes } from "@/components/shared/DustMotes";
import { getInvestigationStats } from "@/lib/investigation";
import { InvestigationSessionProvider } from "@/lib/investigation/session-context";
import type { Case } from "@/types/investigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export function InvestigationShell({
  caseFile,
  children,
}: {
  caseFile: Case;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const stats = getInvestigationStats(caseFile);
  const fullCanvas =
    pathname.includes("/board") ||
    pathname.includes("/interrogate") ||
    pathname.includes("/result");

  return (
    <InvestigationSessionProvider routeId={caseFile.id} caseId={caseFile.backendId}>
      <div className="desk-blotter relative min-h-dvh">
      <DustMotes />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(196_160_106/7%),transparent_46%)]" />
      <div
        className={cn(
          "relative mx-auto flex min-h-dvh flex-col gap-6 px-4 py-5 md:px-8 lg:flex-row lg:gap-10",
          fullCanvas ? "max-w-[1600px]" : "max-w-[1400px]"
        )}
      >
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-10">
          <a
            href="#desk-main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-burgundy focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:tracking-[0.2em] focus:text-paper focus:uppercase"
          >
            Skip to desk
          </a>
          <InvestigationTopbar
            number={caseFile.number}
            title={caseFile.title}
            progress={stats.progress}
          />
          <motion.div
            id="desk-main"
            key={pathname}
            initial={mounted && !reducedMotion ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn("mt-8 flex-1", fullCanvas && "flex min-h-0 flex-col")}
          >
            {children}
            <DeskPager caseFile={caseFile} />
          </motion.div>
        </div>
      </div>
    </div>
    </InvestigationSessionProvider>
  );
}

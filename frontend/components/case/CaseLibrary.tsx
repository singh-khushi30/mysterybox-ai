"use client";

import { motion } from "framer-motion";
import { ArchiveFolder } from "@/components/case/ArchiveFolder";
import { ArchiveHeader } from "@/components/layout/ArchiveHeader";
import { cases } from "@/lib/cases";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function CaseLibrary() {
  const reducedMotion = usePrefersReducedMotion();
  const [openCase, ...lockedCases] = cases;

  return (
    <main className="desk-blotter relative min-h-dvh px-6 py-8 md:px-12 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/45%)_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <ArchiveHeader />
        <p className="mt-4 max-w-xl font-serif text-beige/65">
          The cabinet is not empty. One file has been left out of the drawer — as if
          someone expected you.
        </p>

        <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="-rotate-2"
          >
            {openCase && <ArchiveFolder caseFile={openCase} featured />}
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {lockedCases.map((caseFile, index) => (
              <motion.div
                key={caseFile.id}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 + index * 0.1 }}
                className={index === 1 ? "rotate-2" : "-rotate-1"}
              >
                <ArchiveFolder caseFile={caseFile} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

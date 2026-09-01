"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArchiveFolder } from "@/components/case/ArchiveFolder";
import { ArchiveHeader } from "@/components/layout/ArchiveHeader";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { CaseFile } from "@/types/case";

export function CaseLibrary({
  playable,
  locked,
  notice,
}: {
  playable: CaseFile[];
  locked: CaseFile[];
  notice?: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [openCase, ...otherPlayable] = playable;
  const sideCases = [...otherPlayable, ...locked];

  return (
    <main className="desk-blotter relative min-h-dvh px-6 py-8 md:px-12 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/45%)_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <ArchiveHeader />
        <p className="mt-4 max-w-xl font-serif text-beige/65">
          The cabinet is not empty. One file has been left out of the drawer — as if
          someone expected you.
        </p>

        {notice}

        {!openCase && !notice && (
          <p className="mt-10 font-display text-2xl text-beige/55 italic">
            The drawer is empty. No playable files have been released.
          </p>
        )}

        <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {openCase && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="-rotate-2"
            >
              <ArchiveFolder caseFile={openCase} featured />
            </motion.div>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {sideCases.map((caseFile, index) => (
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

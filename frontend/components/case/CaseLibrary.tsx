"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArchiveFolder } from "@/components/case/ArchiveFolder";
import { ArchiveHeader } from "@/components/layout/ArchiveHeader";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useAuth } from "@/lib/auth/context";
import { ApiError, getCaseEvidence, getCases, getCaseSuspects } from "@/lib/api";
import { toCaseFile } from "@/lib/investigation/from-api";
import type { CaseFile } from "@/types/case";

export function CaseLibrary({
  files,
  notice,
}: {
  files: CaseFile[];
  locked?: CaseFile[];
  notice?: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { ready, user, profile } = useAuth();
  const [archive, setArchive] = useState(files);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void getCases()
      .then(async (cases) => {
        const next = await Promise.all(
          cases.map(async (item, index) => {
            const routeId = String(item.caseNumber).padStart(3, "0");
            if (item.status === "locked") {
              return toCaseFile(item, index, [], [], routeId);
            }
            const [suspects, evidence] = await Promise.all([
              getCaseSuspects(item.id),
              getCaseEvidence(item.id),
            ]);
            return toCaseFile(item, index, suspects, evidence, routeId);
          })
        );
        if (!cancelled) setArchive(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError) {
          setArchive(files);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [files, ready, user?.id, profile?.stats.completedCases]);

  const ordered = useMemo(
    () => [...archive].sort((left, right) => Number(left.number) - Number(right.number)),
    [archive]
  );
  const featured =
    ordered.find((item) => item.archiveStatus === "in_progress" || item.archiveStatus === "available") ??
    ordered[0];
  const sideCases = ordered.filter((item) => item.id !== featured?.id);
  const allComplete =
    ordered.length > 0 && ordered.every((item) => item.archiveStatus === "completed");

  return (
    <main className="desk-blotter relative min-h-dvh px-6 py-8 md:px-12 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/45%)_100%)]" />
      <div className="relative mx-auto max-w-6xl">
        <ArchiveHeader />
        <p className="mt-4 max-w-xl font-serif text-beige/65">
          {allComplete
            ? "The cabinet is closed. Three seals are on the blotter."
            : "The cabinet is not empty. Files are opened in order — as if someone expected you to finish the last page first."}
        </p>

        {notice}

        {!featured && !notice && (
          <p className="mt-10 font-display text-2xl text-beige/55 italic">
            The drawer is empty. No playable files have been released.
          </p>
        )}

        <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {featured && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="-rotate-2"
            >
              <ArchiveFolder caseFile={featured} featured />
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

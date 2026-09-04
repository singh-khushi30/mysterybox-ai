"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { evidenceKindLabel } from "@/lib/investigation";
import type { Case, Evidence } from "@/types/investigation";

type EvidenceModalProps = {
  caseFile: Case;
  evidence: Evidence;
  pinned: boolean;
  onClose: () => void;
  onPin: () => void;
};

export function EvidenceModal({
  caseFile,
  evidence,
  pinned,
  onClose,
  onPin,
}: EvidenceModalProps) {
  const suspect = caseFile.suspects.find((item) => item.id === evidence.relatedSuspectId);
  const sealed = !evidence.discovered;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.28 }}
        onClick={(event) => event.stopPropagation()}
        className="grid w-full max-w-3xl overflow-hidden border border-brass/20 bg-[#14110e] shadow-[0_30px_80px_rgb(0_0_0/55%)] md:grid-cols-[0.9fr_1.1fr]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
      >
        <div className="flex min-h-48 items-end bg-[#cbb89a] p-5 text-[#2d2118]">
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.22em] uppercase">
              {evidence.fileNumber}
            </p>
            <p className="mt-2 font-display text-3xl break-words">{evidence.imageLabel}</p>
          </div>
        </div>
        <div className="min-w-0 p-6">
          <p className="font-mono text-[0.62rem] tracking-[0.22em] text-brass uppercase">
            {evidenceKindLabel(evidence.kind)}
          </p>
          <h2 id="evidence-title" className="mt-2 font-display text-3xl break-words text-paper">
            {evidence.title}
          </h2>
          <p className="mt-4 leading-7 break-words text-beige/75">
            {sealed
              ? "This file is still sealed. Discover it at the desk before the text can be read."
              : evidence.description}
          </p>
          <dl className="mt-5 space-y-2 font-mono text-[0.68rem] tracking-[0.12em] text-beige/60 uppercase">
            <div className="flex justify-between gap-4 border-b border-brass/10 py-2">
              <dt>Timestamp</dt>
              <dd>{sealed ? "—" : evidence.timestamp}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-brass/10 py-2">
              <dt>Location found</dt>
              <dd className="text-right break-words">{sealed ? "—" : evidence.location}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt>Related suspect</dt>
              <dd>{sealed ? "—" : (suspect?.name ?? "Unassigned")}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPin}
              disabled={sealed}
              className="border border-burgundy/50 bg-burgundy/80 px-4 py-2 font-mono text-[0.62rem] tracking-[0.16em] text-paper uppercase disabled:opacity-40"
            >
              {pinned ? "Pinned to board" : "Add to Evidence Board"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-brass/25 px-4 py-2 font-mono text-[0.62rem] tracking-[0.16em] text-beige uppercase"
            >
              Close file
            </button>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

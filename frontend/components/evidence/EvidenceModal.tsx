"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getEvidence } from "@/lib/api";
import { evidenceKindLabel } from "@/lib/investigation";
import { mergeEvidence } from "@/lib/investigation/from-api";
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
  const [file, setFile] = useState(evidence);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const suspect = caseFile.suspects.find((item) => item.id === file.relatedSuspectId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getEvidence(evidence.id)
      .then((api) => {
        if (cancelled) return;
        setFile(mergeEvidence(evidence, api));
        setStatus("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setFile(evidence);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [evidence]);

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
      >
        <div className="flex min-h-48 items-end bg-[#cbb89a] p-5 text-[#2d2118]">
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.22em] uppercase">
              {file.fileNumber}
            </p>
            <p className="mt-2 font-display text-3xl">{file.imageLabel}</p>
          </div>
        </div>
        <div className="p-6">
          <p className="font-mono text-[0.62rem] tracking-[0.22em] text-brass uppercase">
            {evidenceKindLabel(file.kind)}
          </p>
          <h2 className="mt-2 font-display text-3xl text-paper">{file.title}</h2>
          {status === "loading" && (
            <p className="mt-3 font-display text-beige/45 italic">Confirming the file…</p>
          )}
          {status === "error" && (
            <p className="mt-3 font-display text-beige/45 italic">
              The bureau could not confirm this file. The desk copy remains.
            </p>
          )}
          <p className="mt-4 leading-7 text-beige/75">{file.description}</p>
          <dl className="mt-5 space-y-2 font-mono text-[0.68rem] tracking-[0.12em] text-beige/60 uppercase">
            <div className="flex justify-between gap-4 border-b border-brass/10 py-2">
              <dt>Timestamp</dt>
              <dd>{file.timestamp}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-brass/10 py-2">
              <dt>Location found</dt>
              <dd className="text-right">{file.location}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt>Related suspect</dt>
              <dd>{suspect?.name ?? "Unassigned"}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPin}
              className="border border-burgundy/50 bg-burgundy/80 px-4 py-2 font-mono text-[0.62rem] tracking-[0.16em] text-paper uppercase"
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

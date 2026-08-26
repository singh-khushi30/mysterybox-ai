"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import type { Evidence } from "@/types/investigation";

type ConfrontModalProps = {
  evidence: Evidence;
  question: string;
  sending: boolean;
  reply: string | null;
  onQuestionChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
};

export function ConfrontModal({
  evidence,
  question,
  sending,
  reply,
  onQuestionChange,
  onSend,
  onClose,
}: ConfrontModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-labelledby="confront-title"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden border border-brass/25 bg-[#120f0c] shadow-[0_40px_100px_rgb(0_0_0/70%)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />
        <div className="paper-texture mx-6 mt-6 p-5 text-[#2d2118]">
          <p className="font-mono text-[0.58rem] tracking-[0.22em] uppercase">
            {evidence.fileNumber} · placed on the table
          </p>
          <h2 id="confront-title" className="mt-2 font-display text-3xl">
            {evidence.title}
          </h2>
          <p className="mt-3 leading-7">{evidence.description}</p>
        </div>
        <div className="p-6">
          <label
            htmlFor="confront-question"
            className="font-mono text-[0.62rem] tracking-[0.22em] text-brass uppercase"
          >
            Question
          </label>
          <textarea
            id="confront-question"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="How do you account for this?"
            className="mt-2 min-h-24 w-full resize-y border border-brass/20 bg-ink/40 p-3 font-serif text-base text-paper outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
          />
          {reply && (
            <p className="mt-4 border-l border-brass/40 pl-3 font-display text-lg text-beige/80 italic">
              “{reply}”
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <WaxSealButton disabled={!question.trim() || sending} onClick={onSend}>
              {sending ? "Waiting…" : "Send"}
            </WaxSealButton>
            <button
              type="button"
              onClick={onClose}
              className="border border-brass/25 px-4 py-2 font-mono text-[0.62rem] tracking-[0.16em] text-beige uppercase focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

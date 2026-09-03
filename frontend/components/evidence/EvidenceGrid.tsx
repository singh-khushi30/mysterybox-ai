"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import { EvidenceModal } from "@/components/evidence/EvidenceModal";
import { evidenceKindLabel } from "@/lib/investigation";
import { useInvestigationProgress, useProgressCase } from "@/lib/investigation/progress-context";
import type { Case, Evidence, EvidenceKind } from "@/types/investigation";
import { cn } from "@/lib/utils";

const kindOrder: EvidenceKind[] = [
  "cctv",
  "receipt",
  "phone",
  "photograph",
  "statement",
  "object",
];

export function EvidenceGrid({ caseFile }: { caseFile: Case }) {
  const liveCase = useProgressCase(caseFile);
  const { discover, discoveringId } = useInvestigationProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const boardIds = useBoardIds(liveCase.id);
  const selected = liveCase.evidence.find((item) => item.id === selectedId);

  const grouped = useMemo(() => {
    return kindOrder
      .map((kind) => ({
        kind,
        items: liveCase.evidence.filter((item) => item.kind === kind),
      }))
      .filter((group) => group.items.length > 0);
  }, [liveCase.evidence]);

  return (
    <>
      <div className="space-y-8">
        {grouped.length === 0 && (
          <p className="font-display text-lg text-beige/50 italic">
            The evidence drawer has not been opened.
          </p>
        )}
        {grouped.map((group) => (
          <section key={group.kind}>
            <h2 className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
              {evidenceKindLabel(group.kind)}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item, index) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  delay={index * 0.04}
                  examining={discoveringId === item.id}
                  onOpen={async () => {
                    if (item.discovered) {
                      setSelectedId(item.id);
                      return;
                    }
                    const opened = await discover(item.id);
                    if (opened) setSelectedId(item.id);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <EvidenceModal
            caseFile={liveCase}
            evidence={selected}
            pinned={boardIds.ids.includes(selected.id)}
            onClose={() => setSelectedId(null)}
            onPin={() => boardIds.pin(selected.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EvidenceCard({
  item,
  delay,
  examining,
  onOpen,
}: {
  item: Evidence;
  delay: number;
  examining: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -5 }}
      onClick={onOpen}
      className={cn(
        "group relative overflow-hidden border p-0 text-left",
        item.discovered
          ? "border-brass/20 bg-[#161310]"
          : "border-white/8 bg-[#110e0c]"
      )}
    >
      <div className={cn("relative h-36", surfaceClass(item.kind, item.discovered))}>
        <span className="absolute top-3 left-3 font-mono text-[0.58rem] tracking-[0.2em] text-brass/80 uppercase">
          {item.fileNumber}
        </span>
        <span className="absolute right-3 bottom-3 font-display text-lg text-paper/80">
          {item.imageLabel}
        </span>
        {!item.discovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
            {examining ? (
              <span className="font-mono text-[0.58rem] tracking-[0.18em] text-brass uppercase">
                Yielding…
              </span>
            ) : (
              <Lock className="size-5 text-brass/70" />
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-mono text-[0.58rem] tracking-[0.18em] text-beige/40 uppercase">
          {evidenceKindLabel(item.kind)}
        </p>
        <h3 className="mt-1 font-display text-xl text-paper">
          {item.discovered ? item.title : "Undiscovered"}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-beige/55">
          {item.discovered
            ? item.description
            : "This file remains sealed until the desk yields it."}
        </p>
      </div>
    </motion.button>
  );
}

function surfaceClass(kind: EvidenceKind, discovered: boolean) {
  if (!discovered) return "bg-[#1a1410]";
  switch (kind) {
    case "cctv":
      return "bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgb(255_255_255/4%)_7px)] bg-[#0d1210]";
    case "receipt":
      return "bg-[#e8d7be]";
    case "phone":
      return "bg-[#d7c4a4]";
    case "photograph":
      return "bg-[#cbb89a]";
    case "statement":
      return "bg-[#e4d6be]";
    default:
      return "bg-[#2a1c16]";
  }
}

function useBoardIds(caseId: string) {
  const key = `mysterybox.board.${caseId}`;
  const raw = useSyncExternalStore(
    subscribeBoard,
    () => window.localStorage.getItem(key) ?? "[]",
    () => "[]"
  );
  const ids = (() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  })();

  return {
    ids,
    pin(id: string) {
      const next = ids.includes(id) ? ids : [...ids, id];
      window.localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event("mysterybox-board"));
    },
  };
}

function subscribeBoard(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("mysterybox-board", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("mysterybox-board", onChange);
  };
}

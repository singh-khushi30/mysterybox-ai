"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Portrait } from "@/components/shared/Portrait";
import { ConfrontModal } from "@/components/interrogation/ConfrontModal";
import {
  mockAnswer,
  mockConfront,
  mockContradictions,
  openingTranscript,
  suspectScriptKey,
} from "@/lib/investigation/interrogation";
import { suspicionLabel } from "@/lib/investigation";
import type { Case, Suspect } from "@/types/investigation";
import type { TranscriptLine } from "@/types/board";
import { cn } from "@/lib/utils";

export function InterrogationDesk({
  caseFile,
  suspect,
}: {
  caseFile: Case;
  suspect: Suspect;
}) {
  const [lines, setLines] = useState<TranscriptLine[]>(() =>
    openingTranscript(suspect.name, suspect.initials)
  );
  const [draft, setDraft] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [confrontOpen, setConfrontOpen] = useState(false);
  const [confrontQuestion, setConfrontQuestion] = useState("");
  const [confrontReply, setConfrontReply] = useState<string | null>(null);
  const [confrontSending, setConfrontSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const connected = caseFile.evidence.filter(
    (item) => suspect.connectedEvidenceIds.includes(item.id) && item.discovered
  );
  const timeline = caseFile.timeline.filter((event) => event.suspectId === suspect.id);
  const scriptKey = suspectScriptKey(suspect.name);
  const contradictions = mockContradictions[scriptKey] ?? [];
  const selectedEvidence = connected.find((item) => item.id === selectedEvidenceId);

  function appendLine(speaker: TranscriptLine["speaker"], text: string) {
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const line: TranscriptLine = {
      id: `${Date.now()}-${speaker}`,
      speaker,
      name: speaker === "detective" ? "Det. Vale" : suspect.name,
      time: stamp,
      text,
    };
    setLines((current) => [...current, line]);
    window.requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function sendQuestion() {
    const question = draft.trim();
    if (!question || waiting) return;
    setDraft("");
    appendLine("detective", question);
    setWaiting(true);
    window.setTimeout(() => {
      appendLine("suspect", mockAnswer(scriptKey, question));
      setWaiting(false);
    }, 700);
  }

  return (
    <div className="grid min-h-[70vh] gap-5 xl:grid-cols-[220px_minmax(0,1fr)_240px]">
      <aside className="space-y-4">
        <Portrait
          initials={suspect.initials}
          className="aspect-[3/4] w-full text-5xl"
        />
        <div>
          <p className="font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
            File S-{suspect.initials}
          </p>
          <h2 className="font-display text-3xl text-paper">{suspect.name}</h2>
          <p className="text-sm text-beige/55">{suspect.role}</p>
          <p className="mt-2 font-mono text-[0.62rem] tracking-[0.14em] text-brass uppercase">
            {suspicionLabel(suspect.suspicion)}
          </p>
        </div>
        <PaperNote title="Relationship">{suspect.relationship}</PaperNote>
        <PaperNote title="Known alibi">{suspect.alibi}</PaperNote>
        <Link
          href={`/cases/${caseFile.id}/investigate/suspects/${suspect.id}`}
          className="inline-block font-mono text-[0.58rem] tracking-[0.18em] text-brass uppercase hover:text-paper"
        >
          Return to profile
        </Link>
      </aside>

      <section className="flex min-h-[560px] flex-col border border-brass/15 bg-[#14110e]/80">
        <header className="flex items-center justify-between border-b border-brass/15 px-4 py-3">
          <p className="font-mono text-[0.62rem] tracking-[0.22em] text-brass uppercase">
            Interview transcript
          </p>
          <p className="font-mono text-[0.58rem] tracking-[0.16em] text-beige/40 uppercase">
            Room 2 · not for the press
          </p>
        </header>
        <div
          ref={logRef}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5"
          role="log"
          aria-live="polite"
          aria-label="Interview transcript"
        >
          {lines.map((line, index) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(index * 0.02, 0.2) }}
              className="grid grid-cols-[5.5rem_1fr] gap-4"
            >
              <p className="font-mono text-[0.62rem] tracking-[0.08em] text-beige/40">
                {line.time}
              </p>
              <div>
                <p
                  className={cn(
                    "font-mono text-[0.62rem] tracking-[0.18em] uppercase",
                    line.speaker === "detective" ? "text-brass" : "text-burgundy"
                  )}
                >
                  {line.name}
                </p>
                <p className="mt-1 font-serif leading-7 text-paper/90">{line.text}</p>
              </div>
            </motion.div>
          ))}
          {waiting && (
            <p className="font-display text-beige/45 italic">The room is quiet…</p>
          )}
        </div>
        <form
          className="flex gap-2 border-t border-brass/15 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion();
          }}
        >
          <label htmlFor="interview-input" className="sr-only">
            Question for {suspect.name}
          </label>
          <textarea
            id="interview-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendQuestion();
              }
            }}
            placeholder="Put the question on the record…"
            rows={2}
            className="flex-1 resize-none border border-brass/20 bg-ink/50 p-3 font-serif text-paper outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
          />
          <button
            type="submit"
            disabled={!draft.trim() || waiting}
            className="self-stretch border border-burgundy/50 bg-burgundy/80 px-4 font-mono text-[0.62rem] tracking-[0.18em] text-paper uppercase transition-colors hover:bg-burgundy disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </section>

      <aside className="space-y-5">
        <Rail title="Connected evidence">
          {connected.length === 0 && (
            <p className="text-sm text-beige/45">No open files on this name.</p>
          )}
          {connected.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedEvidenceId(item.id)}
              className={cn(
                "w-full border px-3 py-2 text-left font-mono text-[0.58rem] tracking-[0.12em] uppercase transition-colors",
                selectedEvidenceId === item.id
                  ? "border-brass/50 bg-burgundy/40 text-paper"
                  : "border-brass/15 text-beige/70 hover:border-brass/30"
              )}
            >
              {item.fileNumber} · {item.title}
            </button>
          ))}
          <button
            type="button"
            disabled={!selectedEvidence}
            onClick={() => {
              setConfrontReply(null);
              setConfrontQuestion(
                selectedEvidence
                  ? `How do you account for ${selectedEvidence.title}?`
                  : ""
              );
              setConfrontOpen(true);
            }}
            className="mt-2 w-full border border-burgundy/50 bg-burgundy/70 px-3 py-2 font-mono text-[0.58rem] tracking-[0.16em] text-paper uppercase disabled:opacity-40"
          >
            Confront Suspect
          </button>
        </Rail>
        <Rail title="Timeline references">
          {timeline.map((event) => (
            <p key={event.id} className="text-sm leading-6 text-beige/70">
              <span className="font-mono text-[0.58rem] tracking-[0.14em] text-brass uppercase">
                {event.time}
              </span>
              <br />
              {event.title}
            </p>
          ))}
        </Rail>
        <Rail title="Previous contradictions">
          {contradictions.map((item) => (
            <p key={item} className="border-l border-burgundy/40 pl-3 text-sm text-beige/65">
              {item}
            </p>
          ))}
        </Rail>
      </aside>

      <AnimatePresence>
        {confrontOpen && selectedEvidence && (
          <ConfrontModal
            evidence={selectedEvidence}
            question={confrontQuestion}
            sending={confrontSending}
            reply={confrontReply}
            onQuestionChange={setConfrontQuestion}
            onSend={() => {
              if (!confrontQuestion.trim()) return;
              setConfrontSending(true);
              window.setTimeout(() => {
                const reply = mockConfront(scriptKey, selectedEvidence.title);
                setConfrontReply(reply);
                setConfrontSending(false);
                appendLine("detective", `Confronting with ${selectedEvidence.fileNumber}. ${confrontQuestion}`);
                appendLine("suspect", reply);
              }, 800);
            }}
            onClose={() => setConfrontOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PaperNote({ title, children }: { title: string; children: string }) {
  return (
    <section className="paper-texture p-3 text-[#2d2118]">
      <h3 className="font-mono text-[0.52rem] tracking-[0.18em] uppercase">{title}</h3>
      <p className="mt-1 text-sm leading-6">{children}</p>
    </section>
  );
}

function Rail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

"use client";

import { useRef, useState, useSyncExternalStore } from "react";

const starterNote = `12 November, after midnight.

The conservatory doors were not forced from outside.
Clara’s hour is unconfirmed.
The watch and the hallway plate do not agree with anyone’s story — yet.
`;

export function DetectiveNotes({ caseId }: { caseId: string }) {
  const storageKey = `mysterybox.notes.${caseId}`;
  const persisted = useSyncExternalStore(
    subscribeNotes,
    () => window.localStorage.getItem(storageKey) ?? starterNote,
    () => starterNote
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState("Filed");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timer = useRef<number>(0);
  const value = draft ?? persisted;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-paper">Field notes</h2>
          <p className="mt-1 text-sm text-beige/50">
            Written to the blotter. Nothing leaves this desk unless you copy it.
          </p>
        </div>
        <p className="font-mono text-[0.62rem] tracking-[0.18em] text-brass uppercase">
          {status}
          {savedAt ? ` · ${formatStamp(savedAt)}` : ""}
        </p>
      </div>
      <div className="relative">
        <div className="absolute -top-2 -right-2 rotate-3 border border-brass/20 bg-[#e8d7be] px-3 py-1 font-mono text-[0.58rem] tracking-[0.16em] text-[#3a2418] uppercase">
          Pin · private
        </div>
        <textarea
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            setStatus("Saving…");
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
              window.localStorage.setItem(storageKey, next);
              window.dispatchEvent(new Event("mysterybox-notes"));
              setSavedAt(new Date());
              setStatus("Filed");
            }, 700);
          }}
          className="paper-texture min-h-[420px] w-full resize-y rounded-sm p-6 font-serif text-lg leading-8 text-[#2d2118] shadow-[0_20px_50px_rgb(0_0_0/35%)] outline-none"
          aria-label="Detective notes"
        />
      </div>
    </section>
  );
}

function subscribeNotes(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("mysterybox-notes", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("mysterybox-notes", onChange);
  };
}

function formatStamp(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

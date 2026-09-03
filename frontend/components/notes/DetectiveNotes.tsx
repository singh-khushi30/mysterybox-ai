"use client";

import { useEffect, useRef, useState } from "react";
import { getSessionNotes, saveSessionNotes } from "@/lib/api";
import { useInvestigationSession } from "@/lib/investigation/session-context";

export function DetectiveNotes({ caseId: _caseId }: { caseId: string }) {
  const { sessionId, ready: sessionReady } = useInvestigationSession();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("Opening…");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number>(0);
  const requestId = useRef(0);

  useEffect(() => {
    if (!sessionReady) return;
    if (!sessionId) {
      setStatus("No session");
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setStatus("Opening…");
    getSessionNotes(sessionId)
      .then((note) => {
        if (cancelled) return;
        setValue(note.content);
        setSavedAt(note.updated_at ? new Date(note.updated_at) : null);
        setStatus(note.updated_at ? "Filed" : "Blank");
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("Could not open");
        setLoaded(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
    };
  }, [sessionId, sessionReady]);

  function queueSave(next: string) {
    if (!sessionId) return;
    setStatus("Saving…");
    window.clearTimeout(timer.current);
    const ticket = ++requestId.current;
    timer.current = window.setTimeout(() => {
      saveSessionNotes(sessionId, next)
        .then((note) => {
          if (ticket !== requestId.current) return;
          setSavedAt(note.updated_at ? new Date(note.updated_at) : new Date());
          setStatus("Filed");
        })
        .catch(() => {
          if (ticket !== requestId.current) return;
          setStatus("Could not file");
        });
    }, 700);
  }

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
          disabled={!loaded || !sessionId}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            queueSave(next);
          }}
          className="paper-texture min-h-[420px] w-full resize-y rounded-sm p-6 font-serif text-lg leading-8 text-[#2d2118] shadow-[0_20px_50px_rgb(0_0_0/35%)] outline-none disabled:opacity-70"
          aria-label="Detective notes"
        />
      </div>
    </section>
  );
}

function formatStamp(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

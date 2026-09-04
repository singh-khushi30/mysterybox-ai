"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ApiError, getSessionResult } from "@/lib/api";
import { loadAccusation } from "@/lib/investigation/solve";
import { useInvestigationSession } from "@/lib/investigation/session-context";
import type { ApiCaseResult } from "@/types/api";
import type { Case } from "@/types/investigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function ResultReveal({ caseFile }: { caseFile: Case }) {
  const reduced = usePrefersReducedMotion();
  const { sessionId, ready: sessionReady } = useInvestigationSession();
  const [result, setResult] = useState<ApiCaseResult | null>(null);
  const [status, setStatus] = useState<"loading" | "open" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Opening the seal…");
  const accusationRaw = useSyncExternalStore(
    subscribeAccusation,
    () => window.sessionStorage.getItem(`mysterybox.accusation.${caseFile.id}`),
    () => null
  );
  const localAccusation = useMemo(() => {
    if (!accusationRaw) return null;
    try {
      return JSON.parse(accusationRaw) as ReturnType<typeof loadAccusation>;
    } catch {
      return null;
    }
  }, [accusationRaw]);

  useEffect(() => {
    if (!sessionReady) return;
    if (!sessionId) {
      void Promise.resolve().then(() => {
        setStatus("open");
        setMessage("The seal has not been set.");
      });
      return;
    }

    let cancelled = false;
    setStatus("loading");
    getSessionResult(sessionId)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 409) {
          setStatus("open");
          setMessage(error.message);
          return;
        }
        setStatus("error");
        setMessage(
          error instanceof ApiError ? error.message : "The closing file could not be opened."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionReady]);

  const accused =
    result?.submitted.suspectName ??
    caseFile.suspects.find((suspect) => suspect.id === localAccusation?.suspectId)?.name;
  const used = result
    ? result.submitted.evidence.map((item) => {
        const local = caseFile.evidence.find((entry) => entry.id === item.id);
        return {
          id: item.id,
          fileNumber: local?.fileNumber ?? "EV",
          title: item.title,
        };
      })
    : caseFile.evidence.filter((item) => localAccusation?.evidenceIds.includes(item.id));

  return (
    <section className="relative mx-auto max-w-3xl overflow-hidden py-6 text-center">
      <motion.p
        initial={reduced ? false : { opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.42em" }}
        transition={{ duration: 1.1 }}
        className="font-mono text-[0.68rem] text-brass uppercase"
      >
        Blackwood Manor · 12 November 1928
      </motion.p>
      <motion.h2
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25 }}
        className="mt-6 font-display text-5xl tracking-[0.18em] text-paper uppercase md:text-7xl"
      >
        Case Closed
      </motion.h2>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="mt-4 font-mono text-[0.68rem] tracking-[0.28em] text-brass uppercase"
      >
        {status === "ready"
          ? result?.culpritCorrect
            ? "Solved"
            : "Incorrect"
          : status === "loading"
            ? "Pending"
            : "Unsealed"}
      </motion.p>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="mt-4 font-display text-xl text-beige/70 italic"
      >
        {status === "ready"
          ? result?.feedback ?? "The conservatory is quiet. The files remain."
          : status === "loading"
            ? "Opening the seal…"
            : message}
      </motion.p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <RevealCard delay={0.85} label="Score" value={result ? `${result.totalScore}` : "—"}>
          {result
            ? `Culprit ${result.breakdown.culprit} · Evidence ${result.breakdown.evidence} · Motive ${result.breakdown.motive} · Reasoning ${result.breakdown.reasoning}`
            : "of a possible hundred, as the bureau scores a first closing."}
        </RevealCard>
        <RevealCard delay={1} label="Detective Rank" value={result?.rank ?? "—"}>
          The seal is yours. The next folder is not yet on the desk.
        </RevealCard>
      </div>

      {status === "ready" && result && (
        <motion.article
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.6 }}
          className="paper-texture mt-8 p-6 text-left text-[#2d2118] shadow-[0_24px_60px_rgb(0_0_0/40%)]"
        >
          <p className="font-mono text-[0.58rem] tracking-[0.22em] uppercase">True solution</p>
          <h3 className="mt-2 font-display text-3xl">{result.actual.culpritName}</h3>
          <p className="mt-3 leading-7">{result.actual.explanation}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[0.58rem] tracking-[0.16em] uppercase">Motive</dt>
              <dd className="mt-1 font-display text-lg">{result.actual.motive}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.58rem] tracking-[0.16em] uppercase">Instrument</dt>
              <dd className="mt-1 font-display text-lg">{result.actual.method}</dd>
            </div>
          </dl>
        </motion.article>
      )}

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.35, duration: 0.6 }}
        className="mt-8 grid gap-6 text-left md:grid-cols-2"
      >
        <div className="border border-brass/15 p-5">
          <h3 className="font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
            Your accusation
          </h3>
          <p className="mt-2 font-display text-2xl text-paper">
            {result?.submitted.suspectName ?? accused ?? "Unfiled"}
          </p>
          <p className="mt-2 text-sm text-beige/60">
            {result?.submitted.motive ?? localAccusation?.motive}
          </p>
          <p className="mt-1 text-sm text-beige/60">
            {result?.submitted.method ?? localAccusation?.weapon}
          </p>
          {(result?.submitted.reasoning ?? localAccusation?.reasoning) && (
            <p className="mt-3 font-display text-beige/70 italic">
              “{result?.submitted.reasoning ?? localAccusation?.reasoning}”
            </p>
          )}
        </div>
        <div className="border border-brass/15 p-5">
          <h3 className="font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
            Evidence used
          </h3>
          <ul className="mt-3 space-y-2">
            {used.map((item) => (
              <li
                key={item.id}
                className="font-mono text-[0.68rem] tracking-[0.1em] text-beige/75 uppercase"
              >
                {item.fileNumber} · {item.title}
              </li>
            ))}
            {used.length === 0 && (
              <li className="text-sm text-beige/45">No files were attached to the seal.</li>
            )}
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="mt-8 border border-brass/15 p-5 text-left"
      >
        <h3 className="font-mono text-[0.58rem] tracking-[0.22em] text-brass uppercase">
          Timeline summary
        </h3>
        <ol className="mt-4 space-y-3">
          {caseFile.timeline.map((event) => (
            <li key={event.id} className="flex gap-4 text-sm text-beige/70">
              <span className="w-24 shrink-0 font-mono text-[0.62rem] tracking-[0.12em] text-brass uppercase">
                {event.time}
              </span>
              <span>{event.title}</span>
            </li>
          ))}
        </ol>
      </motion.div>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7 }}
        className="mt-10 flex flex-wrap justify-center gap-4"
      >
        <Link
          href="/cases"
          className="border border-brass/40 bg-burgundy/80 px-6 py-3 font-mono text-[0.68rem] tracking-[0.2em] text-paper uppercase"
        >
          Return to the archive
        </Link>
        <Link
          href="/profile"
          className="border border-brass/25 px-6 py-3 font-mono text-[0.68rem] tracking-[0.2em] text-beige uppercase hover:text-paper"
        >
          Detective profile
        </Link>
      </motion.div>
    </section>
  );
}

function RevealCard({
  delay,
  label,
  value,
  children,
}: {
  delay: number;
  label: string;
  value: string;
  children: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55 }}
      className="border border-brass/20 bg-[#161310]/80 p-5"
    >
      <p className="font-mono text-[0.58rem] tracking-[0.22em] text-beige/45 uppercase">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl text-paper">{value}</p>
      <p className="mt-2 text-sm text-beige/50">{children}</p>
    </motion.div>
  );
}

function subscribeAccusation(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

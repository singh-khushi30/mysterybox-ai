"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import { Portrait } from "@/components/shared/Portrait";
import { ApiError, submitAccusation } from "@/lib/api";
import { accusationOptions, saveAccusation } from "@/lib/investigation/solve";
import { persistSession } from "@/lib/investigation/session";
import { useAuth } from "@/lib/auth/context";
import { useProgressCase } from "@/lib/investigation/progress-context";
import { useInvestigationSession } from "@/lib/investigation/session-context";
import type { Case } from "@/types/investigation";
import { cn } from "@/lib/utils";

export function SolveDesk({ caseFile }: { caseFile: Case }) {
  const liveCase = useProgressCase(caseFile);
  const { sessionId, session, ready: sessionReady, setSession } = useInvestigationSession();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const discovered = liveCase.evidence.filter((item) => item.discovered);
  const { motives: MOTIVES, methods: WEAPONS } = accusationOptions(caseFile.id);
  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [motive, setMotive] = useState<string | null>(null);
  const [weapon, setWeapon] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionActive = session?.status === "in_progress";
  const alreadyClosed = session?.status === "completed";
  const ready = Boolean(
    sessionId &&
      sessionActive &&
      suspectId &&
      motive &&
      weapon &&
      evidenceIds.length &&
      reasoning.trim() &&
      !submitting
  );

  function toggleEvidence(id: string) {
    setEvidenceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        Final paper
      </p>
      <h2 className="mt-2 font-display text-4xl text-paper md:text-5xl">Name the last guest</h2>
      <p className="mt-3 max-w-xl text-beige/60">
        Choose the name, the reason, the instrument, and the files that will bear the seal.
        The bureau records the accusation as written.
      </p>

      <Field label="Suspect">
        <div className="grid gap-3 sm:grid-cols-2">
          {caseFile.suspects.map((suspect) => (
            <button
              key={suspect.id}
              type="button"
              onClick={() => setSuspectId(suspect.id)}
              className={cn(
                "flex items-center gap-3 border p-3 text-left transition-all duration-300 hover:-translate-y-0.5",
                suspectId === suspect.id
                  ? "border-brass/50 bg-burgundy/40"
                  : "border-brass/15 hover:border-brass/30"
              )}
            >
              <Portrait initials={suspect.initials} className="size-12 text-sm" />
              <div>
                <p className="font-display text-lg text-paper">{suspect.name}</p>
                <p className="text-sm text-beige/50">{suspect.role}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Motive">
        <div className="grid gap-2">
          {MOTIVES.map((item) => (
            <Choice
              key={item}
              label={item}
              active={motive === item}
              onClick={() => setMotive(item)}
            />
          ))}
        </div>
      </Field>

      <Field label="Weapon">
        <div className="grid gap-2 sm:grid-cols-2">
          {WEAPONS.map((item) => (
            <Choice
              key={item}
              label={item}
              active={weapon === item}
              onClick={() => setWeapon(item)}
            />
          ))}
        </div>
      </Field>

      <Field label="Supporting evidence">
        <div className="flex flex-wrap gap-2">
          {discovered.map((item) => {
            const active = evidenceIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleEvidence(item.id)}
                aria-pressed={active}
                className={cn(
                  "border px-3 py-2 font-mono text-[0.62rem] tracking-[0.12em] uppercase transition-colors",
                  active
                    ? "border-brass/50 bg-[#e8d7be] text-[#2d2118]"
                    : "border-brass/20 text-beige/70 hover:border-brass/40"
                )}
              >
                {item.fileNumber} · {item.title}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Reasoning">
        <textarea
          value={reasoning}
          onChange={(event) => setReasoning(event.target.value)}
          placeholder="Set down why this name, this hour, this instrument…"
          className="paper-texture min-h-36 w-full resize-y p-4 font-serif text-lg leading-8 text-[#2d2118] outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
          aria-label="Reasoning for the accusation"
        />
      </Field>

      {error && (
        <p className="mt-6 text-center font-display text-beige/70 italic">{error}</p>
      )}
      {alreadyClosed && (
        <p className="mt-6 text-center font-display text-beige/60 italic">
          The seal is already on the paper.
        </p>
      )}

      <div className="mt-10 flex justify-center">
        <WaxSealButton
          className="min-w-64 px-12 py-4 text-xl tracking-[0.28em]"
          disabled={alreadyClosed ? false : !ready || !sessionReady}
          onClick={() => {
            if (alreadyClosed) {
              router.push(`/cases/${caseFile.id}/investigate/result`);
              return;
            }
            if (!sessionId || !suspectId || !motive || !weapon || submitting) return;
            setSubmitting(true);
            setError(null);
            const payload = {
              suspectId,
              motive,
              weapon,
              evidenceIds,
              reasoning: reasoning.trim(),
            };
            saveAccusation(caseFile.id, payload, user?.id);
            submitAccusation(sessionId, {
              suspectId,
              motive,
              method: weapon,
              evidenceIds,
              reasoning: payload.reasoning,
            })
              .then(async (result) => {
                setSession(result.session);
                if (user) persistSession(caseFile.id, result.session, user.id);
                await refreshProfile();
                router.push(`/cases/${caseFile.id}/investigate/result`);
              })
              .catch((cause: unknown) => {
                setSubmitting(false);
                setError(
                  cause instanceof ApiError
                    ? cause.message
                    : "The bureau could not take the seal."
                );
              });
          }}
        >
          {alreadyClosed
            ? "See the result"
            : submitting
              ? "Sealing…"
              : "Submit accusation"}
        </WaxSealButton>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-8">
      <legend className="mb-3 font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-4 py-3 text-left font-display text-lg transition-colors",
        active
          ? "border-brass/50 bg-burgundy/35 text-paper"
          : "border-brass/15 text-beige/75 hover:border-brass/30"
      )}
    >
      {label}
    </button>
  );
}

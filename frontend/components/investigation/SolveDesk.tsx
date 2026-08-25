"use client";

import { useState } from "react";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import { Portrait } from "@/components/shared/Portrait";
import type { Case } from "@/types/investigation";

export function SolveDesk({ caseFile }: { caseFile: Case }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="max-w-2xl">
      <p className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        Final paper
      </p>
      <h2 className="mt-2 font-display text-4xl text-paper">Name the last guest</h2>
      <p className="mt-3 text-beige/60">
        An accusation can be written. The bureau will not judge it until the next desk is
        opened.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {caseFile.suspects.map((suspect) => (
          <button
            key={suspect.id}
            type="button"
            onClick={() => setChoice(suspect.id)}
            className={`flex items-center gap-3 border p-3 text-left transition-colors ${
              choice === suspect.id
                ? "border-brass/50 bg-burgundy/40"
                : "border-brass/15 hover:border-brass/30"
            }`}
          >
            <Portrait initials={suspect.initials} className="size-12 text-sm" />
            <div>
              <p className="font-display text-lg text-paper">{suspect.name}</p>
              <p className="text-sm text-beige/50">{suspect.role}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <WaxSealButton disabled={!choice} onClick={() => setSubmitted(true)}>
          Submit accusation
        </WaxSealButton>
        {submitted && (
          <p className="mt-4 font-display text-lg text-beige/70 italic">
            The accusation is noted. Judgment belongs to a later chapter.
          </p>
        )}
      </div>
    </section>
  );
}

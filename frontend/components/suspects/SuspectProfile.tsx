import Link from "next/link";
import { Portrait } from "@/components/shared/Portrait";
import { suspicionLabel } from "@/lib/investigation";
import type { Case, Suspect } from "@/types/investigation";

export function SuspectProfile({
  caseFile,
  suspect,
}: {
  caseFile: Case;
  suspect: Suspect;
}) {
  const connected = caseFile.evidence.filter(
    (item) => suspect.connectedEvidenceIds.includes(item.id) && item.discovered
  );
  const sealed = suspect.connectedEvidenceIds.length - connected.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="space-y-5">
        <Portrait
          initials={suspect.initials}
          className="aspect-[3/4] w-full max-w-xs text-6xl"
        />
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
            File S-{suspect.initials}
          </p>
          <h2 className="mt-1 font-display text-4xl text-paper">{suspect.name}</h2>
          <p className="mt-1 text-beige/60">{suspect.role}</p>
          <p className="mt-3 font-mono text-[0.68rem] tracking-[0.16em] text-brass uppercase">
            {suspicionLabel(suspect.suspicion)}
          </p>
        </div>
        <Link
          href={`/cases/${caseFile.id}/investigate/interrogate/${suspect.id}`}
          className="inline-flex border border-burgundy/50 bg-burgundy/80 px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.2em] text-paper uppercase"
        >
          Interrogate
        </Link>
      </aside>

      <div className="space-y-8">
        <PaperBlock title="Relationship to victim">{suspect.relationship}</PaperBlock>
        <PaperBlock title="Known alibi">{suspect.alibi}</PaperBlock>
        <PaperBlock title="Background">{suspect.background}</PaperBlock>

        <section>
          <h3 className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
            Connected evidence
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {connected.map((item) => (
              <span
                key={item.id}
                className="border border-brass/25 bg-[#e8d7be] px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-[#3a2418] uppercase"
              >
                {item.fileNumber} · {item.title}
              </span>
            ))}
            {sealed > 0 && (
              <span className="border border-white/10 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-beige/35 uppercase">
                {sealed} still sealed
              </span>
            )}
          </div>
        </section>

        <section className="border border-dashed border-brass/20 p-5">
          <h3 className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
            Interrogation history
          </h3>
          <p className="mt-3 font-display text-lg text-beige/55 italic">
            {suspect.questioned
              ? "One preliminary interview is on file. The full interrogation desk opens next."
              : "No interrogation has been recorded. The chair is empty."}
          </p>
        </section>
      </div>
    </div>
  );
}

function PaperBlock({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <section className="paper-texture rounded-sm p-5 text-[#2d2118]">
      <h3 className="font-mono text-[0.62rem] tracking-[0.22em] uppercase">{title}</h3>
      <p className="mt-2 leading-7">{children}</p>
    </section>
  );
}

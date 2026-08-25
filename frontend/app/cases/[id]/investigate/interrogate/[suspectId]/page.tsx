import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuspect } from "@/lib/investigation";

export default async function InterrogatePage({
  params,
}: {
  params: Promise<{ id: string; suspectId: string }>;
}) {
  const { id, suspectId } = await params;
  const suspect = getSuspect(id, suspectId);
  if (!suspect) notFound();

  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-[0.68rem] tracking-[0.32em] text-brass uppercase">
        Interview room · {suspect.initials}
      </p>
      <h2 className="mt-4 font-display text-4xl text-paper">
        Interrogation system coming next.
      </h2>
      <p className="mt-4 font-display text-lg text-beige/65 italic">
        {suspect.name} is waiting. The questions are not ready.
      </p>
      <Link
        href={`/cases/${id}/investigate/suspects/${suspect.id}`}
        className="mt-8 inline-block font-mono text-[0.68rem] tracking-[0.22em] text-brass uppercase"
      >
        Return to profile
      </Link>
    </section>
  );
}

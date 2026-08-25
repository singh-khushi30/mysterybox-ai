import Link from "next/link";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-[0.68rem] tracking-[0.32em] text-brass uppercase">
        Evidence Board
      </p>
      <h2 className="mt-4 font-display text-4xl text-paper">Pins are waiting</h2>
      <p className="mt-4 font-display text-lg text-beige/65 italic">
        The cork wall opens next. Evidence you pin is already being kept for it.
      </p>
      <Link
        href={`/cases/${id}/investigate/evidence`}
        className="mt-8 inline-block font-mono text-[0.68rem] tracking-[0.22em] text-brass uppercase"
      >
        Return to evidence
      </Link>
    </section>
  );
}

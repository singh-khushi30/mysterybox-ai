import Link from "next/link";

export function DeskNotice({
  title,
  detail,
  href = "/cases",
  action = "Return to the archive",
}: {
  title: string;
  detail: string;
  href?: string;
  action?: string;
}) {
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h2 className="font-display text-4xl text-paper">{title}</h2>
      <p className="mt-4 font-display text-lg text-beige/65 italic">{detail}</p>
      <Link
        href={href}
        className="mt-8 inline-block font-mono text-[0.68rem] tracking-[0.22em] text-brass uppercase"
      >
        {action}
      </Link>
    </section>
  );
}

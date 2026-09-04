import Link from "next/link";
import { AuthLinks } from "@/components/auth/AuthLinks";

export function ArchiveHeader({ kicker = "The Archive" }: { kicker?: string }) {
  return (
    <header className="flex items-end justify-between gap-6">
      <div>
        <Link
          href="/"
          className="font-mono text-[0.62rem] tracking-[0.36em] text-brass/80 uppercase transition-colors hover:text-brass"
        >
          MysteryBox
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-[0.08em] text-paper md:text-5xl">
          {kicker}
        </h1>
      </div>
      <nav className="flex items-center gap-5">
        <AuthLinks className="font-mono text-[0.62rem] tracking-[0.22em] text-brass/80 uppercase hover:text-brass" />
        <p className="hidden max-w-xs text-right font-display text-lg text-beige/55 italic md:block">
          Files are opened, never rushed.
        </p>
      </nav>
    </header>
  );
}

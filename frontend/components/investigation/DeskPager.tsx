"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Case } from "@/types/investigation";

export function DeskPager({ caseFile }: { caseFile: Case }) {
  const pathname = usePathname();
  const links = getLinks(pathname, caseFile);
  if (!links) return null;

  return (
    <nav
      aria-label="Investigation sequence"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-brass/10 pt-5"
    >
      {links.prev ? (
        <Link
          href={links.prev.href}
          className="font-mono text-[0.62rem] tracking-[0.18em] text-beige/50 uppercase transition-colors hover:text-brass"
        >
          ← {links.prev.label}
        </Link>
      ) : (
        <span />
      )}
      {links.next ? (
        <Link
          href={links.next.href}
          className="font-mono text-[0.62rem] tracking-[0.18em] text-brass uppercase transition-colors hover:text-paper"
        >
          {links.next.label} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function getLinks(pathname: string, caseFile: Case) {
  const base = `/cases/${caseFile.id}/investigate`;
  const firstSuspect = caseFile.suspects[0]?.id ?? "clara";
  const profileMatch = pathname.match(/\/suspects\/([^/]+)$/);
  const interrogateMatch = pathname.match(/\/interrogate\/([^/]+)$/);

  if (pathname.endsWith("/result")) {
    return {
      prev: { href: `${base}/solve`, label: "Accusation" },
      next: { href: "/cases", label: "Archive" },
    };
  }
  if (pathname.endsWith("/solve")) {
    return { prev: { href: `${base}/board`, label: "Evidence Board" }, next: null };
  }
  if (pathname.endsWith("/board")) {
    return {
      prev: { href: `${base}/interrogate/${firstSuspect}`, label: "Interrogation" },
      next: { href: `${base}/solve`, label: "Solve Case" },
    };
  }
  if (pathname.endsWith("/notes")) {
    return {
      prev: { href: `${base}/board`, label: "Evidence Board" },
      next: { href: `${base}/solve`, label: "Solve Case" },
    };
  }
  if (interrogateMatch) {
    return {
      prev: { href: `${base}/timeline`, label: "Timeline" },
      next: { href: `${base}/board`, label: "Evidence Board" },
    };
  }
  if (pathname.endsWith("/timeline")) {
    return {
      prev: { href: `${base}/suspects`, label: "Suspects" },
      next: { href: `${base}/interrogate/${firstSuspect}`, label: "Interrogation" },
    };
  }
  if (profileMatch) {
    return {
      prev: { href: `${base}/suspects`, label: "Suspects" },
      next: {
        href: `${base}/interrogate/${profileMatch[1]}`,
        label: "Interrogation",
      },
    };
  }
  if (pathname.endsWith("/suspects")) {
    return {
      prev: { href: `${base}/evidence`, label: "Evidence" },
      next: { href: `${base}/timeline`, label: "Timeline" },
    };
  }
  if (pathname.endsWith("/evidence")) {
    return {
      prev: { href: base, label: "Investigation" },
      next: { href: `${base}/suspects`, label: "Suspects" },
    };
  }
  if (pathname === base) {
    return {
      prev: { href: `/cases/${caseFile.id}`, label: "Case file" },
      next: { href: `${base}/evidence`, label: "Evidence" },
    };
  }
  return null;
}

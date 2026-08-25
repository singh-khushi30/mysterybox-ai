"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Overview", index: "01" },
  { href: "/evidence", label: "Evidence", index: "02" },
  { href: "/suspects", label: "Suspects", index: "03" },
  { href: "/timeline", label: "Timeline", index: "04" },
  { href: "/board", label: "Evidence Board", index: "05" },
  { href: "/notes", label: "Notes", index: "06" },
  { href: "/solve", label: "Solve Case", index: "07" },
];

export function InvestigationNav({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}/investigate`;

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
      {links.map((link) => {
        const href = `${base}${link.href}`;
        const active =
          link.href === ""
            ? pathname === base
            : pathname.startsWith(href);

        return (
          <Link
            key={link.href}
            href={href}
            className={cn(
              "flex min-w-fit items-baseline gap-3 border px-3 py-2 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors duration-300",
              active
                ? "border-brass/40 bg-burgundy/80 text-paper"
                : "border-transparent text-beige/55 hover:border-brass/20 hover:bg-white/5 hover:text-beige"
            )}
          >
            <span className="text-brass/70">{link.index}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

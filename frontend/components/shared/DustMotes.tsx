"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const motes = [
  { left: "8%", delay: "0s", duration: "18s", size: 2 },
  { left: "22%", delay: "3s", duration: "22s", size: 3 },
  { left: "37%", delay: "7s", duration: "16s", size: 2 },
  { left: "51%", delay: "1s", duration: "24s", size: 2 },
  { left: "64%", delay: "5s", duration: "19s", size: 3 },
  { left: "78%", delay: "9s", duration: "21s", size: 2 },
  { left: "91%", delay: "4s", duration: "17s", size: 2 },
];

export function DustMotes() {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {motes.map((mote) => (
        <span
          key={mote.left}
          className="dust-mote"
          style={{
            left: mote.left,
            width: mote.size,
            height: mote.size,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Case } from "@/types/investigation";
import { cn } from "@/lib/utils";

export function TimelineView({ caseFile }: { caseFile: Case }) {
  const [filter, setFilter] = useState<string>("all");

  const events = useMemo(() => {
    if (filter === "all") return caseFile.timeline;
    if (filter === "unassigned") {
      return caseFile.timeline.filter((event) => event.suspectId === null);
    }
    return caseFile.timeline.filter((event) => event.suspectId === filter);
  }, [caseFile.timeline, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All hours"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {caseFile.suspects.map((suspect) => (
          <FilterChip
            key={suspect.id}
            label={suspect.name.replace(/^Dr\.\s+/, "").split(" ")[0]}
            active={filter === suspect.id}
            onClick={() => setFilter(suspect.id)}
          />
        ))}
        <FilterChip
          label="House / victim"
          active={filter === "unassigned"}
          onClick={() => setFilter("unassigned")}
        />
      </div>

      <ol className="relative mt-10 ml-3 border-l border-brass/25 pl-8">
        {events.map((event, index) => {
          const suspect = caseFile.suspects.find((item) => item.id === event.suspectId);
          return (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative mb-10 last:mb-0"
            >
              <span className="absolute top-1.5 -left-[39px] size-2.5 rounded-full bg-brass" />
              <p className="font-mono text-[0.68rem] tracking-[0.22em] text-brass uppercase">
                {event.time}
              </p>
              <h3 className="mt-1 font-display text-2xl text-paper">{event.title}</h3>
              {suspect && (
                <p className="mt-1 font-mono text-[0.58rem] tracking-[0.16em] text-beige/45 uppercase">
                  Linked · {suspect.name}
                </p>
              )}
              <p className="mt-3 max-w-2xl leading-7 text-beige/70">{event.detail}</p>
            </motion.li>
          );
        })}
      </ol>
      {events.length === 0 && (
        <p className="mt-10 font-display text-lg text-beige/50 italic">
          No marks on this thread of the night.
        </p>
      )}
    </div>
  );
}

function FilterChip({
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
        "border px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.16em] uppercase transition-colors",
        active
          ? "border-brass/50 bg-burgundy/70 text-paper"
          : "border-brass/15 text-beige/55 hover:border-brass/40 hover:text-beige"
      )}
    >
      {label}
    </button>
  );
}

"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MapPin } from "lucide-react";
import { Portrait } from "@/components/shared/Portrait";
import type { BoardNode } from "@/lib/investigation/board";
import { cn } from "@/lib/utils";

function Pins() {
  return (
    <>
      <Handle id="t" type="target" position={Position.Top} className="board-handle" />
      <Handle id="b" type="source" position={Position.Bottom} className="board-handle" />
      <Handle id="l" type="target" position={Position.Left} className="board-handle" />
      <Handle id="r" type="source" position={Position.Right} className="board-handle" />
    </>
  );
}

export function SuspectNode({ data, selected }: NodeProps<BoardNode>) {
  return (
    <article
      className={cn(
        "relative w-[210px] border bg-[#161310] p-3 shadow-[0_12px_28px_rgb(0_0_0/45%)]",
        selected ? "border-brass" : "border-brass/30"
      )}
    >
      <Pins />
      <span className="board-pin" aria-hidden />
      <div className="flex items-center gap-3">
        <Portrait initials={data.initials ?? "?"} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="font-mono text-[0.52rem] tracking-[0.2em] text-brass uppercase">
            Person of interest
          </p>
          <h3 className="truncate font-display text-lg leading-tight text-paper">
            {data.title}
          </h3>
          <p className="truncate text-[0.7rem] text-beige/55">{data.subtitle}</p>
        </div>
      </div>
    </article>
  );
}

export function EvidenceNode({ data, selected }: NodeProps<BoardNode>) {
  return (
    <article
      className={cn(
        "relative w-[210px] rotate-[-1.5deg] border bg-[#e8d7be] p-3 text-[#2d2118] shadow-[0_10px_24px_rgb(0_0_0/40%)]",
        selected ? "border-[#5c2430]" : "border-[#3a2418]/20"
      )}
    >
      <Pins />
      <span className="board-pin board-pin-paper" aria-hidden />
      <p className="font-mono text-[0.52rem] tracking-[0.18em] uppercase">
        {data.fileNumber}
        {data.pin ? " · pinned" : ""}
      </p>
      <h3 className="mt-1 font-display text-lg leading-tight">{data.title}</h3>
      <p className="mt-1 line-clamp-2 text-[0.7rem] text-[#5c4636]">{data.subtitle}</p>
    </article>
  );
}

export function LocationNode({ data, selected }: NodeProps<BoardNode>) {
  return (
    <article
      className={cn(
        "relative w-[200px] border bg-[#1c1612]/95 px-3 py-2.5 shadow-[0_10px_22px_rgb(0_0_0/40%)]",
        selected ? "border-brass" : "border-brass/25"
      )}
    >
      <Pins />
      <span className="board-pin" aria-hidden />
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-3.5 text-brass" />
        <div>
          <p className="font-mono text-[0.52rem] tracking-[0.18em] text-brass uppercase">
            Location
          </p>
          <h3 className="font-display text-lg leading-tight text-paper">{data.title}</h3>
          <p className="text-[0.68rem] text-beige/50">{data.subtitle}</p>
        </div>
      </div>
    </article>
  );
}

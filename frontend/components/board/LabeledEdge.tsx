"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { BoardEdge } from "@/lib/investigation/board";
import { nextRelation, relationMark } from "@/lib/investigation/board";

function labelOffset(id: string, sourceX: number, sourceY: number, targetX: number, targetY: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 97;
  }
  const along = 0.36 + (hash % 5) * 0.07;
  const side = (hash % 2 === 0 ? 1 : -1) * (10 + (hash % 3) * 6);
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: sourceX + dx * along + (-dy / length) * side,
    y: sourceY + dy * along + (dx / length) * side,
  };
}

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  style,
}: EdgeProps<BoardEdge>) {
  const { setEdges } = useReactFlow();
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const relation = data?.relation ?? "Related";
  const mark = relationMark(relation);
  const label = labelOffset(id, sourceX, sourceY, targetX, targetY);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "#e7d9c3" : "#c4a06a",
          strokeWidth: selected ? 2.2 : 1.6,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan group pointer-events-auto absolute z-10"
          style={{
            transform: `translate(-50%, -50%) translate(${label.x}px, ${label.y}px)`,
          }}
        >
          <button
            type="button"
            title={relation}
            onClick={(event) => {
              event.stopPropagation();
              const next = nextRelation(relation);
              setEdges((edges) =>
                edges.map((edge) =>
                  edge.id === id
                    ? { ...edge, label: next, data: { relation: next } }
                    : edge
                )
              );
            }}
            className="flex size-6 items-center justify-center bg-burgundy font-mono text-[0.68rem] leading-none text-paper uppercase shadow-[0_2px_8px_rgb(0_0_0/45%)] hover:bg-[#7a3340]"
            aria-label={`Thread: ${relation}. Click to change relation.`}
          >
            {mark}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEdges((edges) => edges.filter((edge) => edge.id !== id));
            }}
            className="absolute -top-2 -right-2 hidden size-4 items-center justify-center bg-charcoal font-mono text-[0.62rem] leading-none text-paper group-hover:flex group-focus-within:flex hover:bg-burgundy"
            aria-label="Cut this thread"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

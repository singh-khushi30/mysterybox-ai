"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { BoardEdge } from "@/lib/investigation/board";
import { nextRelation } from "@/lib/investigation/board";

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const relation = data?.relation ?? "Related";

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
          className="nodrag nopan pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1"
          style={{ transform: `translate(${labelX}px, ${labelY}px)` }}
        >
          <button
            type="button"
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
            className="border border-brass/40 bg-[#14110e]/95 px-2 py-0.5 font-mono text-[0.52rem] tracking-[0.16em] text-brass uppercase shadow-[0_4px_12px_rgb(0_0_0/40%)] hover:border-brass hover:text-paper"
            aria-label={`Thread: ${relation}. Click to change relation.`}
          >
            {relation}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEdges((edges) => edges.filter((edge) => edge.id !== id));
            }}
            className="flex size-5 items-center justify-center border border-burgundy/40 bg-burgundy/80 font-mono text-[0.62rem] text-paper hover:bg-burgundy"
            aria-label="Cut this thread"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

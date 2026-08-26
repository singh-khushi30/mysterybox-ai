"use client";

import { useCallback, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EvidenceNode, LocationNode, SuspectNode } from "@/components/board/nodes";
import { LabeledEdge } from "@/components/board/LabeledEdge";
import { buildBoardGraph, type BoardEdge, type BoardNode } from "@/lib/investigation/board";
import type { Case } from "@/types/investigation";

const nodeTypes = {
  suspect: SuspectNode,
  evidence: EvidenceNode,
  location: LocationNode,
};

const edgeTypes = {
  labeled: LabeledEdge,
};

const defaultEdgeOptions = {
  type: "labeled",
  reconnectable: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: "#c4a06a",
  },
  style: { stroke: "#c4a06a", strokeWidth: 1.6 },
  data: { relation: "Related" as const },
};

function readPinned(caseId: string) {
  try {
    return JSON.parse(
      window.localStorage.getItem(`mysterybox.board.${caseId}`) ?? "[]"
    ) as string[];
  } catch {
    return [];
  }
}

function loadGraph(caseFile: Case) {
  const raw = window.localStorage.getItem(`mysterybox.flow.${caseFile.id}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { nodes: BoardNode[]; edges: BoardEdge[] };
      if (parsed.nodes?.length) return parsed;
    } catch {
      /* seed */
    }
  }
  return buildBoardGraph(caseFile, readPinned(caseFile.id));
}

function persistGraph(caseId: string, nodes: BoardNode[], edges: BoardEdge[]) {
  window.localStorage.setItem(
    `mysterybox.flow.${caseId}`,
    JSON.stringify({ nodes, edges })
  );
}

function EvidenceBoardCanvas({ caseFile }: { caseFile: Case }) {
  const seed = useMemo(() => loadGraph(caseFile), [caseFile]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seed.edges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => {
        const next = addEdge(
          { ...connection, ...defaultEdgeOptions, label: "Related" },
          current
        ) as BoardEdge[];
        persistGraph(caseFile.id, nodes, next);
        return next;
      });
    },
    [caseFile.id, nodes, setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      setEdges((current) => {
        const next = reconnectEdge(oldEdge, connection, current) as BoardEdge[];
        persistGraph(caseFile.id, nodes, next);
        return next;
      });
    },
    [caseFile.id, nodes, setEdges]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
            Investigation wall
          </p>
          <h2 className="font-display text-3xl text-paper md:text-4xl">Evidence Board</h2>
          <p className="mt-1 max-w-xl text-sm text-beige/55">
            Drag suspects, files, and rooms. Draw a thread between them. Click a label to
            change the relation. Press Delete or the × to cut a string. Drag a thread’s end
            to reconnect it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = buildBoardGraph(caseFile, readPinned(caseFile.id));
            setNodes(next.nodes);
            setEdges(next.edges);
            persistGraph(caseFile.id, next.nodes, next.edges);
          }}
          className="border border-brass/30 px-3 py-2 font-mono text-[0.58rem] tracking-[0.16em] text-beige uppercase transition-colors hover:border-brass hover:text-paper focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:outline-none"
        >
          Reset wall
        </button>
      </div>

      <div className="evidence-board relative min-h-[70vh] flex-1 overflow-hidden border border-brass/20 shadow-[0_24px_60px_rgb(0_0_0/50%)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeDragStop={() => persistGraph(caseFile.id, nodes, edges as BoardEdge[])}
          onEdgesDelete={(deleted) => {
            const ids = new Set(deleted.map((edge) => edge.id));
            persistGraph(
              caseFile.id,
              nodes,
              edges.filter((edge) => !ids.has(edge.id)) as BoardEdge[]
            );
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          edgesReconnectable
          isValidConnection={(connection) => connection.source !== connection.target}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.35}
          maxZoom={1.8}
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
          className="evidence-flow"
          connectionLineStyle={{ stroke: "#c4a06a", strokeWidth: 1.5 }}
          aria-label="Evidence investigation board"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="rgb(196 160 106 / 18%)"
          />
          <Controls
            showInteractive={false}
            className="evidence-controls"
            aria-label="Board zoom and pan controls"
          />
          <MiniMap
            pannable
            zoomable
            className="evidence-minimap"
            nodeColor={(node) => {
              if (node.type === "suspect") return "#5c2430";
              if (node.type === "location") return "#c4a06a";
              return "#e7d9c3";
            }}
            maskColor="rgb(12 10 8 / 55%)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function EvidenceBoard({ caseFile }: { caseFile: Case }) {
  return (
    <ReactFlowProvider>
      <EvidenceBoardCanvas caseFile={caseFile} />
    </ReactFlowProvider>
  );
}

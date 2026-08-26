import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { BoardNodeData, RelationLabel } from "@/types/board";
import type { Case } from "@/types/investigation";

export const BOARD_LOCATIONS = [
  { id: "loc-conservatory", name: "Conservatory", detail: "Glasshouse · terrace doors" },
  { id: "loc-study", name: "Study", detail: "Writing desk · stopped watch" },
  { id: "loc-dining", name: "Dining Room", detail: "Four courses · empty chair" },
  { id: "loc-west", name: "West Hallway", detail: "House plate · 11:08" },
  { id: "loc-east", name: "East Wing", detail: "Clara’s claimed hour" },
  { id: "loc-gallery", name: "Gallery", detail: "Portraits · Isolde’s alibi" },
] as const;

export type BoardNode = Node<BoardNodeData>;
export type BoardEdge = Edge<{ relation: RelationLabel }>;

const marker = {
  type: MarkerType.ArrowClosed,
  width: 14,
  height: 14,
  color: "#c4a06a",
};

function thread(
  id: string,
  source: string,
  target: string,
  relation: RelationLabel
): BoardEdge {
  return {
    id,
    source,
    target,
    type: "labeled",
    reconnectable: true,
    label: relation,
    data: { relation },
    markerEnd: marker,
    style: { stroke: "#c4a06a", strokeWidth: 1.6 },
  };
}

export function buildBoardGraph(caseFile: Case, pinnedIds: string[]): {
  nodes: BoardNode[];
  edges: BoardEdge[];
} {
  const suspects = caseFile.suspects.map((suspect, index) => ({
    id: `suspect-${suspect.id}`,
    type: "suspect",
    position: { x: 32, y: 40 + index * 150 },
    data: {
      kind: "suspect" as const,
      title: suspect.name,
      subtitle: suspect.role,
      initials: suspect.initials,
    },
  }));

  const locations = BOARD_LOCATIONS.map((location, index) => ({
    id: location.id,
    type: "location",
    position: { x: 300, y: 28 + index * 118 },
    data: {
      kind: "location" as const,
      title: location.name,
      subtitle: location.detail,
    },
  }));

  const discovered = caseFile.evidence.filter((item) => item.discovered);
  const evidence = discovered.map((item, index) => ({
    id: `evidence-${item.id}`,
    type: "evidence",
    position: {
      x: 560 + (index % 2) * 230,
      y: 20 + Math.floor(index / 2) * 136,
    },
    data: {
      kind: "evidence" as const,
      title: item.title,
      subtitle: item.location,
      fileNumber: item.fileNumber,
      pin: pinnedIds.includes(item.id),
    },
  }));

  const edges: BoardEdge[] = [
    thread("e-clara-receipt", "suspect-clara", "evidence-receipt", "Motive"),
    thread("e-clara-east", "suspect-clara", "loc-east", "Alibi"),
    thread("e-silas-watch", "suspect-silas", "evidence-watch", "Related"),
    thread("e-silas-dining", "suspect-silas", "loc-dining", "Related"),
    thread("e-jonah-cctv", "suspect-jonah", "evidence-cctv", "Seen With"),
    thread("e-cctv-west", "evidence-cctv", "loc-west", "Evidence"),
    thread("e-isolde-letter", "suspect-isolde", "evidence-letter", "Motive"),
    thread("e-isolde-gallery", "suspect-isolde", "loc-gallery", "Alibi"),
    thread("e-coupe-cons", "evidence-coupe", "loc-conservatory", "Evidence"),
    thread("e-watch-study", "evidence-watch", "loc-study", "Related"),
    thread("e-phone-isolde", "evidence-phone", "suspect-isolde", "Related"),
    thread("e-photo-dining", "evidence-photograph", "loc-dining", "Related"),
    thread("e-glove-west", "evidence-glove", "loc-west", "Contradicts"),
  ];

  return { nodes: [...suspects, ...locations, ...evidence], edges };
}

export function nextRelation(current: RelationLabel | undefined): RelationLabel {
  const order: RelationLabel[] = [
    "Related",
    "Seen With",
    "Contradicts",
    "Motive",
    "Alibi",
    "Evidence",
  ];
  const index = order.indexOf(current ?? "Related");
  return order[(index + 1) % order.length];
}

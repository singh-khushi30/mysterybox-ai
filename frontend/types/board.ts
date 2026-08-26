export const RELATION_LABELS = [
  "Related",
  "Seen With",
  "Contradicts",
  "Motive",
  "Alibi",
  "Evidence",
] as const;

export type RelationLabel = (typeof RELATION_LABELS)[number];

export type BoardNodeKind = "suspect" | "evidence" | "location";

export type BoardNodeData = {
  kind: BoardNodeKind;
  title: string;
  subtitle: string;
  initials?: string;
  fileNumber?: string;
  pin?: boolean;
};

export type Accusation = {
  suspectId: string;
  motive: string;
  weapon: string;
  evidenceIds: string[];
  reasoning: string;
};

export type TranscriptLine = {
  id: string;
  speaker: "detective" | "suspect";
  name: string;
  time: string;
  text: string;
};

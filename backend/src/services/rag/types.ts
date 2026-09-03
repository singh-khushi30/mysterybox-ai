export const KNOWLEDGE_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  SECRET: "SECRET",
  GROUND_TRUTH: "GROUND_TRUTH",
} as const;

export type KnowledgeVisibility =
  (typeof KNOWLEDGE_VISIBILITY)[keyof typeof KNOWLEDGE_VISIBILITY];

export const SOURCE_TYPES = {
  case: "case",
  suspect: "suspect",
  evidence: "evidence",
  timeline: "timeline",
  ground_truth: "ground_truth",
} as const;

export type KnowledgeSourceType = (typeof SOURCE_TYPES)[keyof typeof SOURCE_TYPES];

export type KnowledgeImportance = "low" | "medium" | "high" | "critical";

export type KnowledgeDocument = {
  case_id: string;
  suspect_id: string | null;
  source_type: KnowledgeSourceType;
  source_id: string | null;
  content: string;
  visibility: KnowledgeVisibility;
  importance: KnowledgeImportance;
  metadata: Record<string, string | number | boolean | null>;
};

export const SUSPECT_RETRIEVAL_VISIBILITY: KnowledgeVisibility[] = [
  KNOWLEDGE_VISIBILITY.PUBLIC,
  KNOWLEDGE_VISIBILITY.PRIVATE,
  KNOWLEDGE_VISIBILITY.SECRET,
];

export const PUBLIC_RETRIEVAL_VISIBILITY: KnowledgeVisibility[] = [
  KNOWLEDGE_VISIBILITY.PUBLIC,
];

export function assertNoGroundTruth(visibility: readonly KnowledgeVisibility[]) {
  return visibility.filter((item) => item !== KNOWLEDGE_VISIBILITY.GROUND_TRUTH);
}

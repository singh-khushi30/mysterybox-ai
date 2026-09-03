import { supabase } from "../../config/supabase.js";
import { embedQuery } from "../embeddings/index.js";
import {
  KNOWLEDGE_VISIBILITY,
  PUBLIC_RETRIEVAL_VISIBILITY,
  SUSPECT_RETRIEVAL_VISIBILITY,
  assertNoGroundTruth,
  type KnowledgeVisibility,
} from "./types.js";

export type RetrievalHit = {
  id: string;
  case_id: string;
  suspect_id: string | null;
  source_type: string;
  source_id: string | null;
  content: string;
  visibility: KnowledgeVisibility;
  importance: string;
  similarity: number;
};

export type RetrieveKnowledgeInput = {
  query: string;
  caseId: string;
  suspectId?: string | null;
  allowedVisibility?: KnowledgeVisibility[];
  limit?: number;
};

function resolveAllowedVisibility(input: RetrieveKnowledgeInput) {
  const requested = assertNoGroundTruth(
    input.allowedVisibility ??
      (input.suspectId ? SUSPECT_RETRIEVAL_VISIBILITY : PUBLIC_RETRIEVAL_VISIBILITY)
  );

  if (!input.suspectId) {
    return requested.filter((item) => item === KNOWLEDGE_VISIBILITY.PUBLIC);
  }

  return requested;
}

export async function retrieveKnowledge(input: RetrieveKnowledgeInput): Promise<RetrievalHit[]> {
  const allowed = resolveAllowedVisibility(input);
  if (allowed.length === 0) {
    return [];
  }

  const embedding = await embedQuery(input.query);
  const { data, error } = await supabase.rpc("match_case_knowledge", {
    query_embedding: `[${embedding.join(",")}]`,
    filter_case_id: input.caseId,
    allowed_visibility: allowed,
    match_count: input.limit ?? 8,
    filter_suspect_id: input.suspectId ?? null,
  });

  if (error) {
    throw new Error("Unable to search case knowledge.");
  }

  return ((data ?? []) as RetrievalHit[]).filter((hit) => {
    return hit.case_id === input.caseId && hit.visibility !== KNOWLEDGE_VISIBILITY.GROUND_TRUTH;
  });
}

import { supabase } from "../../config/supabase.js";
import { embedDocuments } from "../embeddings/index.js";
import { buildCaseKnowledgeDocuments } from "./chunker.js";
import type { KnowledgeDocument } from "./types.js";

type CaseRow = {
  id: string;
  title: string;
  description: string;
};

type SuspectRow = {
  id: string;
  name: string;
  occupation: string | null;
  relationship_to_victim: string | null;
  bio: string | null;
  public_alibi: string | null;
  personality: string | null;
};

type EvidenceRow = {
  id: string;
  title: string;
  type: string;
  description: string;
  location_found: string | null;
  importance: string;
};

type TimelineRow = {
  id: string;
  event_time: string;
  public_description: string;
  hidden_description: string | null;
  related_suspect_id: string | null;
  related_evidence_id: string | null;
  sequence: number;
};

type GroundTruthRow = {
  id: string;
  culprit_id: string;
  motive: string;
  method: string;
  time_of_crime: string;
  location: string;
  solution_explanation: string;
};

export function isMissingKnowledgeTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /case_knowledge|schema cache/i.test(error.message ?? "")
  );
}

function throwIndexError(error: { code?: string; message?: string } | null) {
  if (isMissingKnowledgeTable(error)) {
    throw new Error(
      "case_knowledge is missing. Apply backend/supabase/migrations/003_case_knowledge.sql in the Supabase SQL editor."
    );
  }
  throw new Error("Unable to index case knowledge.");
}

export async function loadCaseKnowledgeSource(caseId: string) {
  const caseFile = await supabase
    .from("cases")
    .select("id, title, description")
    .eq("id", caseId)
    .maybeSingle();

  if (caseFile.error) {
    throw new Error("Unable to load case knowledge.");
  }
  if (!caseFile.data) {
    throw new Error("Case not found.");
  }

  const [suspects, evidence, timeline, groundTruth] = await Promise.all([
    supabase
      .from("suspects")
      .select(
        "id, name, occupation, relationship_to_victim, bio, public_alibi, personality"
      )
      .eq("case_id", caseId)
      .order("name", { ascending: true }),
    supabase
      .from("evidence")
      .select("id, title, type, description, location_found, importance")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true }),
    supabase
      .from("timeline_events")
      .select(
        "id, event_time, public_description, hidden_description, related_suspect_id, related_evidence_id, sequence"
      )
      .eq("case_id", caseId)
      .order("sequence", { ascending: true }),
    supabase
      .from("case_ground_truth")
      .select("id, culprit_id, motive, method, time_of_crime, location, solution_explanation")
      .eq("case_id", caseId)
      .maybeSingle(),
  ]);

  if (suspects.error || evidence.error || timeline.error || groundTruth.error) {
    throw new Error("Unable to load case knowledge.");
  }

  return {
    caseFile: caseFile.data as CaseRow,
    suspects: (suspects.data ?? []) as SuspectRow[],
    evidence: (evidence.data ?? []) as EvidenceRow[],
    timeline: (timeline.data ?? []) as TimelineRow[],
    groundTruth: (groundTruth.data ?? null) as GroundTruthRow | null,
  };
}

export async function replaceCaseKnowledge(caseId: string, documents: KnowledgeDocument[]) {
  const removed = await supabase.from("case_knowledge").delete().eq("case_id", caseId);
  if (removed.error) {
    throwIndexError(removed.error);
  }

  if (documents.length === 0) {
    return { indexed: 0 };
  }

  const embeddings = await embedDocuments(documents.map((document) => document.content));
  const rows = documents.map((document, index) => ({
    ...document,
    embedding: `[${embeddings[index].join(",")}]`,
  }));

  const chunkSize = 12;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const inserted = await supabase
      .from("case_knowledge")
      .insert(rows.slice(index, index + chunkSize));
    if (inserted.error) {
      throwIndexError(inserted.error);
    }
  }

  return { indexed: rows.length };
}

export async function indexCaseKnowledge(caseId: string) {
  const source = await loadCaseKnowledgeSource(caseId);
  const documents = buildCaseKnowledgeDocuments(source);
  const result = await replaceCaseKnowledge(caseId, documents);

  const counts = documents.reduce(
    (acc, document) => {
      acc[document.visibility] = (acc[document.visibility] ?? 0) + 1;
      acc[document.source_type] = (acc[document.source_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    caseId,
    title: source.caseFile.title,
    indexed: result.indexed,
    counts,
  };
}

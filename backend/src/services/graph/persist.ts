import { supabase } from "../../config/supabase.js";
import { HttpError } from "../../utils/http.js";
import type { ContradictionHit } from "./types.js";

const CONTRADICTION_FIELDS =
  "id, session_id, suspect_id, statement, evidence_id, explanation, confidence, fingerprint, discovered_at";

export type StoredContradiction = {
  id: string;
  session_id: string;
  suspect_id: string;
  statement: string;
  evidence_id: string | null;
  explanation: string;
  confidence: number;
  fingerprint: string;
  discovered_at: string;
};

export async function listSessionContradictions(sessionId: string) {
  const { data, error } = await supabase
    .from("detected_contradictions")
    .select(CONTRADICTION_FIELDS)
    .eq("session_id", sessionId)
    .order("discovered_at", { ascending: true });

  if (error) {
    if (error.code === "PGRST205" || /detected_contradictions/i.test(error.message)) {
      return [] as StoredContradiction[];
    }
    throw new HttpError(500, "Unable to load contradictions");
  }

  return (data ?? []) as StoredContradiction[];
}

export async function saveContradiction(
  sessionId: string,
  suspectId: string,
  hit: ContradictionHit
): Promise<ContradictionHit> {
  if (!hit.detected || !hit.fingerprint) {
    return hit;
  }

  const existing = await supabase
    .from("detected_contradictions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("suspect_id", suspectId)
    .eq("fingerprint", hit.fingerprint)
    .maybeSingle();

  if (existing.error) {
    if (existing.error.code === "PGRST205" || /detected_contradictions/i.test(existing.error.message)) {
      return { ...hit, duplicate: false };
    }
    throw new HttpError(500, "Unable to file the contradiction");
  }

  if (existing.data) {
    return { ...hit, duplicate: true };
  }

  const inserted = await supabase.from("detected_contradictions").insert({
    session_id: sessionId,
    suspect_id: suspectId,
    statement: hit.statement,
    evidence_id: hit.evidenceId,
    explanation: hit.explanation,
    confidence: hit.confidence,
    fingerprint: hit.fingerprint,
  });

  if (inserted.error) {
    if (/duplicate|unique/i.test(inserted.error.message)) {
      return { ...hit, duplicate: true };
    }
    throw new HttpError(500, "Unable to file the contradiction");
  }

  return { ...hit, duplicate: false };
}

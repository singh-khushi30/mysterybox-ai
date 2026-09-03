import { supabase } from "../config/supabase.js";
import { getPlayableCase } from "./cases.js";
import { listPublicEvidenceForCase } from "./evidence.js";
import { HttpError } from "../utils/http.js";

const SESSION_FIELDS = "id, case_id, status, started_at, completed_at, score";

export async function createSession(caseId: string) {
  await getPlayableCase(caseId);

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      case_id: caseId,
      status: "in_progress",
      score: null,
    })
    .select(SESSION_FIELDS)
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to start investigation");
  }

  await seedDefaultDiscoveries(data.id, data.case_id);
  return data;
}

async function seedDefaultDiscoveries(sessionId: string, caseId: string) {
  const catalog = await listPublicEvidenceForCase(caseId);
  const defaults = catalog.filter((item) => item.discovered_by_default);
  if (defaults.length === 0) {
    return;
  }

  const { error } = await supabase.from("session_evidence").upsert(
    defaults.map((item) => ({
      session_id: sessionId,
      evidence_id: item.id,
    })),
    { onConflict: "session_id,evidence_id", ignoreDuplicates: true }
  );

  if (error) {
    throw new HttpError(500, "Unable to open the evidence drawer");
  }
}

export async function getSession(id: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select(SESSION_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load session");
  }
  if (!data) {
    throw new HttpError(404, "Session not found");
  }

  return data;
}

export async function completeSession(id: string) {
  const existing = await getSession(id);

  if (existing.status === "completed") {
    return existing;
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SESSION_FIELDS)
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to complete session");
  }

  return data;
}

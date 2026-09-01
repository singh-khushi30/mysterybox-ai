import { supabase } from "../config/supabase.js";
import { getPlayableCase } from "./cases.js";
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

  return data;
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

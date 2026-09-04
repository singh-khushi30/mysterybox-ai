import { supabase } from "../config/supabase.js";
import { getSession } from "./sessions.js";
import { HttpError } from "../utils/http.js";

const NOTE_FIELDS = "id, session_id, content, created_at, updated_at";

export async function getSessionNotes(sessionId: string, userId?: string) {
  await getSession(sessionId, userId);

  const { data, error } = await supabase
    .from("detective_notes")
    .select(NOTE_FIELDS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load notes");
  }

  return {
    content: data?.content ?? "",
    updated_at: data?.updated_at ?? null,
  };
}

export async function saveSessionNotes(sessionId: string, content: string, userId?: string) {
  await getSession(sessionId, userId);

  const { data: existing, error: existingError } = await supabase
    .from("detective_notes")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, "Unable to save notes");
  }

  const result = existing
    ? await supabase
        .from("detective_notes")
        .update({ content })
        .eq("id", existing.id)
        .select(NOTE_FIELDS)
        .single()
    : await supabase
        .from("detective_notes")
        .insert({ session_id: sessionId, content })
        .select(NOTE_FIELDS)
        .single();

  if (result.error || !result.data) {
    throw new HttpError(500, "Unable to save notes");
  }

  return {
    content: result.data.content,
    updated_at: result.data.updated_at,
  };
}

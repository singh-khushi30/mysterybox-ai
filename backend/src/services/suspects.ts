import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { getPlayableCase } from "./cases.js";

const SUSPECT_FIELDS =
  "id, case_id, name, age, occupation, relationship_to_victim, bio, public_alibi, portrait_url, personality, created_at";

export async function listSuspectsForCase(caseId: string) {
  await getPlayableCase(caseId);

  const { data, error } = await supabase
    .from("suspects")
    .select(SUSPECT_FIELDS)
    .eq("case_id", caseId)
    .order("name", { ascending: true });

  if (error) {
    throw new HttpError(500, "Unable to load suspects");
  }

  return data ?? [];
}

export async function getSuspect(id: string) {
  const { data, error } = await supabase
    .from("suspects")
    .select(SUSPECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load suspect");
  }
  if (!data) {
    throw new HttpError(404, "Suspect not found");
  }

  await getPlayableCase(data.case_id);
  return data;
}

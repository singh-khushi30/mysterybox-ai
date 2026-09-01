import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";

const CASE_FIELDS =
  "id, title, slug, description, difficulty, estimated_minutes, cover_image_url, status, created_at";

export async function listPlayableCases() {
  const { data, error } = await supabase
    .from("cases")
    .select(CASE_FIELDS)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, "Unable to load cases");
  }

  return data ?? [];
}

export async function getPlayableCase(id: string) {
  const { data, error } = await supabase
    .from("cases")
    .select(CASE_FIELDS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load case");
  }
  if (!data) {
    throw new HttpError(404, "Case not found");
  }

  return data;
}

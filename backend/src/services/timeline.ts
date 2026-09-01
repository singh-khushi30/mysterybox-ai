import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { getPlayableCase } from "./cases.js";

const TIMELINE_FIELDS =
  "id, case_id, event_time, public_description, related_suspect_id, related_evidence_id, sequence, created_at";

export async function listVisibleTimeline(caseId: string) {
  await getPlayableCase(caseId);

  const { data, error } = await supabase
    .from("timeline_events")
    .select(TIMELINE_FIELDS)
    .eq("case_id", caseId)
    .order("sequence", { ascending: true })
    .order("event_time", { ascending: true });

  if (error) {
    throw new HttpError(500, "Unable to load timeline");
  }

  return data ?? [];
}

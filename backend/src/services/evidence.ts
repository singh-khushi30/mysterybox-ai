import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { getPlayableCase } from "./cases.js";

const EVIDENCE_FIELDS =
  "id, case_id, title, type, description, file_url, location_found, discovered_by_default, importance, created_at";

export async function listVisibleEvidenceForCase(caseId: string) {
  await getPlayableCase(caseId);

  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_FIELDS)
    .eq("case_id", caseId)
    .eq("discovered_by_default", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, "Unable to load evidence");
  }

  return data ?? [];
}

export async function listPublicEvidenceForCase(caseId: string) {
  await getPlayableCase(caseId);

  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_FIELDS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, "Unable to load evidence");
  }

  return data ?? [];
}

export async function getPublicEvidence(id: string) {
  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load evidence");
  }
  if (!data) {
    throw new HttpError(404, "Evidence not found");
  }

  await getPlayableCase(data.case_id);
  return data;
}

export async function getVisibleEvidence(id: string) {
  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_FIELDS)
    .eq("id", id)
    .eq("discovered_by_default", true)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to load evidence");
  }
  if (!data) {
    throw new HttpError(404, "Evidence not found");
  }

  await getPlayableCase(data.case_id);
  return data;
}

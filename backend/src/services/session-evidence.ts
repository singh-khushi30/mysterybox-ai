import { supabase } from "../config/supabase.js";
import { getPublicEvidence, listPublicEvidenceForCase } from "./evidence.js";
import { getSession } from "./sessions.js";
import { HttpError } from "../utils/http.js";

async function ensureDefaultDiscoveries(sessionId: string, caseId: string) {
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

export async function listSessionEvidence(sessionId: string, userId?: string) {
  const session = await getSession(sessionId, userId);
  await ensureDefaultDiscoveries(sessionId, session.case_id);

  const [{ data, error }, catalog] = await Promise.all([
    supabase
      .from("session_evidence")
      .select("evidence_id, discovered_at")
      .eq("session_id", sessionId)
      .order("discovered_at", { ascending: true }),
    listPublicEvidenceForCase(session.case_id),
  ]);

  if (error) {
    throw new HttpError(500, "Unable to load session evidence");
  }

  const byId = new Map(catalog.map((item) => [item.id, item]));
  return (data ?? [])
    .map((row) => byId.get(row.evidence_id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function discoverSessionEvidence(
  sessionId: string,
  evidenceId: string,
  userId?: string
) {
  const session = await getSession(sessionId, userId);
  const evidence = await getPublicEvidence(evidenceId);

  if (evidence.case_id !== session.case_id) {
    throw new HttpError(400, "Evidence does not belong to this case");
  }

  const { error } = await supabase.from("session_evidence").upsert(
    {
      session_id: sessionId,
      evidence_id: evidenceId,
    },
    { onConflict: "session_id,evidence_id", ignoreDuplicates: true }
  );

  if (error) {
    throw new HttpError(500, "Unable to record the discovery");
  }

  return evidence;
}

import { listSessionContradictions } from "./graph/persist.js";
import { getSession } from "./sessions.js";

export async function listContradictionsForSession(sessionId: string) {
  await getSession(sessionId);
  const rows = await listSessionContradictions(sessionId);
  return rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    suspect_id: row.suspect_id,
    statement: row.statement,
    evidence_id: row.evidence_id,
    explanation: row.explanation,
    confidence: Number(row.confidence),
    discovered_at: row.discovered_at,
  }));
}

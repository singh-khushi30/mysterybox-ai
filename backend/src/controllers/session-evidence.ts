import type { Request, Response } from "express";
import { discoverSessionEvidence, listSessionEvidence } from "../services/session-evidence.js";
import { ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

export async function getSessionEvidence(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const data = await listSessionEvidence(sessionId);
  res.json(ok(data));
}

export async function postDiscoverEvidence(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const evidenceId = parseId(req.params.evidenceId, "evidence id");
  const data = await discoverSessionEvidence(sessionId, evidenceId);
  res.json(ok(data));
}

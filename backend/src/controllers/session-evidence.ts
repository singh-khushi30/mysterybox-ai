import type { Request, Response } from "express";
import { getRequestUser } from "../middleware/auth.js";
import { discoverSessionEvidence, listSessionEvidence } from "../services/session-evidence.js";
import { ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

export async function getSessionEvidence(req: Request, res: Response) {
  const user = getRequestUser(req);
  const sessionId = parseId(req.params.id, "session id");
  const data = await listSessionEvidence(sessionId, user.id);
  res.json(ok(data));
}

export async function postDiscoverEvidence(req: Request, res: Response) {
  const user = getRequestUser(req);
  const sessionId = parseId(req.params.id, "session id");
  const evidenceId = parseId(req.params.evidenceId, "evidence id");
  const data = await discoverSessionEvidence(sessionId, evidenceId, user.id);
  res.json(ok(data));
}

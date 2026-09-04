import type { Request, Response } from "express";
import { getRequestUser } from "../middleware/auth.js";
import { listContradictionsForSession } from "../services/contradictions.js";
import { ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

export async function getSessionContradictions(req: Request, res: Response) {
  const user = getRequestUser(req);
  const sessionId = parseId(req.params.id, "session id");
  const data = await listContradictionsForSession(sessionId, user.id);
  res.json(ok(data));
}

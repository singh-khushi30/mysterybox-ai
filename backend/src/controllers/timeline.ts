import type { Request, Response } from "express";
import { getOptionalUser } from "../middleware/auth.js";
import { assertCaseReadable } from "../services/progression.js";
import { listVisibleTimeline } from "../services/timeline.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseTimeline(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const caseId = parseId(req.params.id, "case id");
  await assertCaseReadable(caseId, user?.id ?? null);
  const data = await listVisibleTimeline(caseId);
  res.json(ok(data));
}

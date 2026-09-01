import type { Request, Response } from "express";
import { listVisibleTimeline } from "../services/timeline.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseTimeline(req: Request, res: Response) {
  const caseId = parseId(req.params.id, "case id");
  const data = await listVisibleTimeline(caseId);
  res.json(ok(data));
}

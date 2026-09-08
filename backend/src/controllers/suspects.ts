import type { Request, Response } from "express";
import { getOptionalUser } from "../middleware/auth.js";
import { assertCaseReadable } from "../services/progression.js";
import { getSuspect, listSuspectsForCase } from "../services/suspects.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseSuspects(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const caseId = parseId(req.params.id, "case id");
  await assertCaseReadable(caseId, user?.id ?? null);
  const data = await listSuspectsForCase(caseId);
  res.json(ok(data));
}

export async function getSuspectById(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const id = parseId(req.params.id, "suspect id");
  const data = await getSuspect(id);
  await assertCaseReadable(data.case_id, user?.id ?? null);
  res.json(ok(data));
}

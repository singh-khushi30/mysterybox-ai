import type { Request, Response } from "express";
import { getSuspect, listSuspectsForCase } from "../services/suspects.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseSuspects(req: Request, res: Response) {
  const caseId = parseId(req.params.id, "case id");
  const data = await listSuspectsForCase(caseId);
  res.json(ok(data));
}

export async function getSuspectById(req: Request, res: Response) {
  const id = parseId(req.params.id, "suspect id");
  const data = await getSuspect(id);
  res.json(ok(data));
}

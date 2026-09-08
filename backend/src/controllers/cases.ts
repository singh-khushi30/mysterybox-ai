import type { Request, Response } from "express";
import { getOptionalUser } from "../middleware/auth.js";
import { assertCaseReadable, getArchiveCase, listArchiveForUser } from "../services/progression.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCases(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const data = await listArchiveForUser(user?.id ?? null);
  res.json(ok(data));
}

export async function getCase(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const id = parseId(req.params.id, "case id");
  await assertCaseReadable(id, user?.id ?? null);
  const data = await getArchiveCase(id, user?.id ?? null);
  res.json(ok(data));
}

import type { Request, Response } from "express";
import { listPlayableCases, getPlayableCase } from "../services/cases.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCases(_req: Request, res: Response) {
  const data = await listPlayableCases();
  res.json(ok(data));
}

export async function getCase(req: Request, res: Response) {
  const id = parseId(req.params.id, "case id");
  const data = await getPlayableCase(id);
  res.json(ok(data));
}

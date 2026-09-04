import type { Request, Response } from "express";
import {
  getPublicEvidence,
  listPublicEvidenceForCase,
  listVisibleEvidenceForCase,
  redactHiddenEvidence,
} from "../services/evidence.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseEvidence(req: Request, res: Response) {
  const caseId = parseId(req.params.id, "case id");
  const data = await listVisibleEvidenceForCase(caseId);
  res.json(ok(data));
}

export async function getCasePublicEvidence(req: Request, res: Response) {
  const caseId = parseId(req.params.id, "case id");
  const data = await listPublicEvidenceForCase(caseId);
  res.json(ok(data.map(redactHiddenEvidence)));
}

export async function getEvidenceById(req: Request, res: Response) {
  const id = parseId(req.params.id, "evidence id");
  const data = await getPublicEvidence(id);
  res.json(ok(redactHiddenEvidence(data)));
}

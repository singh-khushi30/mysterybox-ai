import type { Request, Response } from "express";
import { getOptionalUser } from "../middleware/auth.js";
import {
  getPublicEvidence,
  listPublicEvidenceForCase,
  listVisibleEvidenceForCase,
  redactHiddenEvidence,
} from "../services/evidence.js";
import { assertCaseReadable } from "../services/progression.js";
import { parseId } from "../utils/ids.js";
import { ok } from "../utils/http.js";

export async function getCaseEvidence(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const caseId = parseId(req.params.id, "case id");
  await assertCaseReadable(caseId, user?.id ?? null);
  const data = await listVisibleEvidenceForCase(caseId);
  res.json(ok(data));
}

export async function getCasePublicEvidence(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const caseId = parseId(req.params.id, "case id");
  await assertCaseReadable(caseId, user?.id ?? null);
  const data = await listPublicEvidenceForCase(caseId);
  res.json(ok(data.map(redactHiddenEvidence)));
}

export async function getEvidenceById(req: Request, res: Response) {
  const user = getOptionalUser(req);
  const id = parseId(req.params.id, "evidence id");
  const data = await getPublicEvidence(id);
  await assertCaseReadable(data.case_id, user?.id ?? null);
  res.json(ok(redactHiddenEvidence(data)));
}

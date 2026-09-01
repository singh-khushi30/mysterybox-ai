import type { Request, Response } from "express";
import { z } from "zod";
import { completeSession, createSession, getSession } from "../services/sessions.js";
import { HttpError, ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

const caseIdSchema = z.string().uuid();

function parseCaseId(body: unknown) {
  if (!body || typeof body !== "object" || !("caseId" in body)) {
    throw new HttpError(400, "Missing case id");
  }

  const value = (body as { caseId: unknown }).caseId;
  if (value === undefined || value === null || value === "") {
    throw new HttpError(400, "Missing case id");
  }

  const parsed = caseIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid case id");
  }

  return parsed.data;
}

export async function postSession(req: Request, res: Response) {
  const caseId = parseCaseId(req.body);
  const data = await createSession(caseId);
  res.status(201).json(ok(data));
}

export async function getSessionById(req: Request, res: Response) {
  const id = parseId(req.params.id, "session id");
  const data = await getSession(id);
  res.json(ok(data));
}

export async function patchCompleteSession(req: Request, res: Response) {
  const id = parseId(req.params.id, "session id");
  const data = await completeSession(id);
  res.json(ok(data));
}

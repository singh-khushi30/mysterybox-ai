import type { Request, Response } from "express";
import { z } from "zod";
import { interrogateSuspect, listInterrogationMessages } from "../services/interrogation.js";
import { HttpError, ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

const interrogateSchema = z.object({
  suspectId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  evidenceId: z.string().uuid().optional(),
});

export async function postInterrogate(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const parsed = interrogateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "Invalid interview request");
  }

  const data = await interrogateSuspect({
    sessionId,
    suspectId: parsed.data.suspectId,
    message: parsed.data.message,
    evidenceId: parsed.data.evidenceId,
  });

  res.status(201).json(ok(data));
}

export async function getInterrogation(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const suspectId = parseId(req.params.suspectId, "suspect id");
  const data = await listInterrogationMessages(sessionId, suspectId);
  res.json(ok(data));
}

import type { Request, Response } from "express";
import { z } from "zod";
import { getSessionResult, submitAccusation } from "../services/accusations.js";
import { HttpError, ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

const accusationSchema = z
  .object({
    suspectId: z.string().uuid(),
    motive: z.string().trim().min(1).max(2000),
    method: z.string().trim().min(1).max(2000).optional(),
    weapon: z.string().trim().min(1).max(2000).optional(),
    evidenceIds: z.array(z.string().uuid()).min(1).max(20),
    reasoning: z.string().trim().min(1).max(8000),
  })
  .refine((value) => Boolean(value.method || value.weapon), {
    message: "Missing method",
  });

export async function postAccusation(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const parsed = accusationSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "Invalid accusation");
  }

  const method = parsed.data.method ?? parsed.data.weapon;
  if (!method) {
    throw new HttpError(400, "Invalid accusation");
  }

  const data = await submitAccusation(sessionId, {
    suspectId: parsed.data.suspectId,
    motive: parsed.data.motive,
    method,
    evidenceIds: [...new Set(parsed.data.evidenceIds)],
    reasoning: parsed.data.reasoning,
  });

  res.status(201).json(ok(data));
}

export async function getResult(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const data = await getSessionResult(sessionId);
  res.json(ok(data));
}

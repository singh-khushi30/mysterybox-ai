import type { Request, Response } from "express";
import { z } from "zod";
import { getSessionNotes, saveSessionNotes } from "../services/notes.js";
import { HttpError, ok } from "../utils/http.js";
import { parseId } from "../utils/ids.js";

const notesSchema = z.object({
  content: z.string(),
});

export async function getNotes(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const data = await getSessionNotes(sessionId);
  res.json(ok(data));
}

export async function putNotes(req: Request, res: Response) {
  const sessionId = parseId(req.params.id, "session id");
  const parsed = notesSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "Invalid notes");
  }
  const data = await saveSessionNotes(sessionId, parsed.data.content);
  res.json(ok(data));
}

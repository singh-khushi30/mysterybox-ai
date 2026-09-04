import type { Request, Response } from "express";
import { z } from "zod";
import { getRequestUser } from "../middleware/auth.js";
import { getProfileForUser, updateProfile } from "../services/profiles.js";
import { HttpError, ok } from "../utils/http.js";

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export async function getProfile(req: Request, res: Response) {
  const user = getRequestUser(req);
  const data = await getProfileForUser(user.id, user.email);
  res.json(ok(data));
}

export async function patchProfile(req: Request, res: Response) {
  const user = getRequestUser(req);
  const parsed = updateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "Invalid profile");
  }
  await updateProfile(user.id, { displayName: parsed.data.displayName });
  const data = await getProfileForUser(user.id, user.email);
  res.json(ok(data));
}

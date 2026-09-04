import type { Request, Response } from "express";
import { z } from "zod";
import { registerAccount } from "../services/auth.js";
import { HttpError, ok } from "../utils/http.js";

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
  displayName: z.string().trim().min(1).max(80),
});

export async function postRegister(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new HttpError(400, "Enter a valid email, password, and display name.");
  }

  const data = await registerAccount({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    displayName: parsed.data.displayName,
  });

  res.status(201).json(ok(data));
}

import { z } from "zod";
import { HttpError } from "./http.js";

const uuidSchema = z.string().uuid();

export function parseId(value: string | string[] | undefined, label = "id"): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = uuidSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return parsed.data;
}

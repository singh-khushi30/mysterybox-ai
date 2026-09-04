import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http.js";

const buckets = new Map<string, number[]>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}) {
  const resolveKey = options.key ?? ((req: Request) => req.ip || "unknown");

  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const key = resolveKey(req);
      const now = Date.now();
      const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < options.windowMs);
      if (recent.length >= options.max) {
        throw new HttpError(429, "Too many attempts. Wait a minute, then try again.");
      }
      recent.push(now);
      buckets.set(key, recent);
      next();
    } catch (error) {
      next(error);
    }
  };
}

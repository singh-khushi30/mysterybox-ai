import { Router } from "express";
import { postRegister } from "../controllers/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 8 }),
  asyncHandler(postRegister)
);

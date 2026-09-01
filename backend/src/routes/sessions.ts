import { Router } from "express";
import { getSessionById, patchCompleteSession, postSession } from "../controllers/sessions.js";
import { asyncHandler } from "../middleware/error.js";

export const sessionsRouter = Router();

sessionsRouter.post("/", asyncHandler(postSession));
sessionsRouter.patch("/:id/complete", asyncHandler(patchCompleteSession));
sessionsRouter.get("/:id", asyncHandler(getSessionById));

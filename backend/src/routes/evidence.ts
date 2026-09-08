import { Router } from "express";
import { getEvidenceById } from "../controllers/evidence.js";
import { optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

export const evidenceRouter = Router();

evidenceRouter.use(asyncHandler(optionalAuth));

evidenceRouter.get("/:id", asyncHandler(getEvidenceById));

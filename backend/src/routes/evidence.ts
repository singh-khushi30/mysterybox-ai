import { Router } from "express";
import { getEvidenceById } from "../controllers/evidence.js";
import { asyncHandler } from "../middleware/error.js";

export const evidenceRouter = Router();

evidenceRouter.get("/:id", asyncHandler(getEvidenceById));

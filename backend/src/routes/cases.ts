import { Router } from "express";
import { getCase, getCases } from "../controllers/cases.js";
import { getCaseEvidence, getCasePublicEvidence } from "../controllers/evidence.js";
import { getCaseSuspects } from "../controllers/suspects.js";
import { getCaseTimeline } from "../controllers/timeline.js";
import { asyncHandler } from "../middleware/error.js";

export const casesRouter = Router();

casesRouter.get("/", asyncHandler(getCases));
casesRouter.get("/:id/suspects", asyncHandler(getCaseSuspects));
casesRouter.get("/:id/evidence/all", asyncHandler(getCasePublicEvidence));
casesRouter.get("/:id/evidence", asyncHandler(getCaseEvidence));
casesRouter.get("/:id/timeline", asyncHandler(getCaseTimeline));
casesRouter.get("/:id", asyncHandler(getCase));

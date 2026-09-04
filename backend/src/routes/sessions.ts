import { Router } from "express";
import { getResult, postAccusation } from "../controllers/accusations.js";
import { getSessionContradictions } from "../controllers/contradictions.js";
import { getInterrogation, postInterrogate } from "../controllers/interrogation.js";
import { getNotes, putNotes } from "../controllers/notes.js";
import { getSessionEvidence, postDiscoverEvidence } from "../controllers/session-evidence.js";
import { getSessionById, patchCompleteSession, postSession } from "../controllers/sessions.js";
import { asyncHandler } from "../middleware/error.js";

export const sessionsRouter = Router();

sessionsRouter.post("/", asyncHandler(postSession));
sessionsRouter.get("/:id/notes", asyncHandler(getNotes));
sessionsRouter.put("/:id/notes", asyncHandler(putNotes));
sessionsRouter.get("/:id/evidence", asyncHandler(getSessionEvidence));
sessionsRouter.post("/:id/evidence/:evidenceId/discover", asyncHandler(postDiscoverEvidence));
sessionsRouter.post("/:id/interrogate", asyncHandler(postInterrogate));
sessionsRouter.get("/:id/interrogations/:suspectId", asyncHandler(getInterrogation));
sessionsRouter.get("/:id/contradictions", asyncHandler(getSessionContradictions));
sessionsRouter.post("/:id/accusation", asyncHandler(postAccusation));
sessionsRouter.get("/:id/result", asyncHandler(getResult));
sessionsRouter.patch("/:id/complete", asyncHandler(patchCompleteSession));
sessionsRouter.get("/:id", asyncHandler(getSessionById));

import { Router } from "express";
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
sessionsRouter.patch("/:id/complete", asyncHandler(patchCompleteSession));
sessionsRouter.get("/:id", asyncHandler(getSessionById));

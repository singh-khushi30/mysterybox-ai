import { Router } from "express";
import { casesRouter } from "./cases.js";
import { evidenceRouter } from "./evidence.js";
import { sessionsRouter } from "./sessions.js";
import { suspectsRouter } from "./suspects.js";

export const apiRouter = Router();

apiRouter.use("/cases", casesRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/suspects", suspectsRouter);
apiRouter.use("/evidence", evidenceRouter);

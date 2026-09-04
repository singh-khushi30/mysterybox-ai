import { Router } from "express";
import { authRouter } from "./auth.js";
import { casesRouter } from "./cases.js";
import { evidenceRouter } from "./evidence.js";
import { profileRouter } from "./profile.js";
import { sessionsRouter } from "./sessions.js";
import { suspectsRouter } from "./suspects.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/cases", casesRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/suspects", suspectsRouter);
apiRouter.use("/evidence", evidenceRouter);

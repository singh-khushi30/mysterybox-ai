import { Router } from "express";
import { getSuspectById } from "../controllers/suspects.js";
import { optionalAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

export const suspectsRouter = Router();

suspectsRouter.use(asyncHandler(optionalAuth));

suspectsRouter.get("/:id", asyncHandler(getSuspectById));

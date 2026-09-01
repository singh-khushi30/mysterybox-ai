import { Router } from "express";
import { getSuspectById } from "../controllers/suspects.js";
import { asyncHandler } from "../middleware/error.js";

export const suspectsRouter = Router();

suspectsRouter.get("/:id", asyncHandler(getSuspectById));

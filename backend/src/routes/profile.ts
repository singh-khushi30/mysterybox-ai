import { Router } from "express";
import { getProfile, patchProfile } from "../controllers/profiles.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

export const profileRouter = Router();

profileRouter.use(asyncHandler(requireAuth));
profileRouter.get("/", asyncHandler(getProfile));
profileRouter.patch("/", asyncHandler(patchProfile));

import { Router } from "express";
import { postRegister } from "../controllers/auth.js";
import { asyncHandler } from "../middleware/error.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(postRegister));

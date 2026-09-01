import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { fail, HttpError } from "../utils/http.js";

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json(fail(error.message));
    return;
  }

  console.error("Unhandled API error.");
  res.status(500).json(fail("Internal server error"));
};

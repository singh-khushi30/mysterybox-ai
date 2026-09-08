import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";

export type AuthUser = {
  id: string;
  email: string | null;
};

type AuthedRequest = Request & { authUser?: AuthUser };

export function getRequestUser(req: Request): AuthUser {
  const user = (req as AuthedRequest).authUser;
  if (!user) {
    throw new HttpError(401, "Sign in to continue.");
  }
  return user;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Sign in to continue.");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    throw new HttpError(401, "Sign in to continue.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, "Your session is no longer valid.");
  }

  (req as AuthedRequest).authUser = {
    id: data.user.id,
    email: data.user.email ?? null,
  };
  next();
}

export function getOptionalUser(req: Request): AuthUser | null {
  return (req as AuthedRequest).authUser ?? null;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next();
    return;
  }

  const { data } = await supabase.auth.getUser(token);
  if (data.user) {
    (req as AuthedRequest).authUser = {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  }
  next();
}

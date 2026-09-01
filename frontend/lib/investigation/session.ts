import { ApiError, createSession, getSession } from "@/lib/api";
import type { ApiSession } from "@/types/api";

const ACTIVE_KEY = "mysterybox.activeSession";

export type StoredSession = {
  sessionId: string;
  caseId: string;
  routeId: string;
};

function sessionKey(routeId: string) {
  return `mysterybox.session.${routeId}`;
}

function readJson(key: string): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.sessionId || !parsed.caseId || !parsed.routeId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredSession(routeId: string) {
  return readJson(sessionKey(routeId)) ?? readActiveSessionFor(routeId);
}

export function readActiveSession() {
  return readJson(ACTIVE_KEY);
}

function readActiveSessionFor(routeId: string) {
  const active = readActiveSession();
  return active?.routeId === routeId ? active : null;
}

export function writeStoredSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  window.localStorage.setItem(sessionKey(session.routeId), payload);
  window.localStorage.setItem(ACTIVE_KEY, payload);
}

export function clearStoredSession(routeId?: string) {
  if (typeof window === "undefined") return;
  if (routeId) {
    window.localStorage.removeItem(sessionKey(routeId));
    const active = readActiveSession();
    if (active?.routeId === routeId) {
      window.localStorage.removeItem(ACTIVE_KEY);
    }
    return;
  }
  window.localStorage.removeItem(ACTIVE_KEY);
}

export async function validateStoredSession(routeId: string, caseId: string) {
  const stored = readStoredSession(routeId);
  if (!stored) return null;

  try {
    const session = await getSession(stored.sessionId);
    if (session.case_id !== caseId) {
      clearStoredSession(routeId);
      return null;
    }
    writeStoredSession({
      sessionId: session.id,
      caseId: session.case_id,
      routeId,
    });
    return session;
  } catch (error) {
    if (error instanceof ApiError) {
      clearStoredSession(routeId);
      return null;
    }
    throw error;
  }
}

export async function startInvestigationSession(routeId: string, caseId: string) {
  const existing = await validateStoredSession(routeId, caseId);
  if (existing?.status === "in_progress") {
    return existing;
  }

  const session = await createSession(caseId);
  writeStoredSession({
    sessionId: session.id,
    caseId: session.case_id,
    routeId,
  });
  return session;
}

export async function reopenInvestigationSession(routeId: string, caseId: string) {
  const existing = await validateStoredSession(routeId, caseId);
  if (existing) {
    return existing;
  }
  return startInvestigationSession(routeId, caseId);
}

export function persistSession(routeId: string, session: ApiSession) {
  writeStoredSession({
    sessionId: session.id,
    caseId: session.case_id,
    routeId,
  });
}

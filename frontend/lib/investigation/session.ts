import { ApiError, createSession, getSession } from "@/lib/api";
import type { ApiSession } from "@/types/api";

const LEGACY_ACTIVE_KEY = "mysterybox.activeSession";

export type StoredSession = {
  sessionId: string;
  caseId: string;
  routeId: string;
  userId?: string;
};

function activeKey(userId: string) {
  return `mysterybox.activeSession.${userId}`;
}

function sessionKey(routeId: string, userId: string) {
  return `mysterybox.session.${userId}.${routeId}`;
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

export function readStoredSession(routeId: string, userId?: string | null) {
  if (!userId) return null;
  return readJson(sessionKey(routeId, userId)) ?? readActiveSessionFor(routeId, userId);
}

export function readActiveSession(userId?: string | null) {
  if (!userId) return null;
  return readJson(activeKey(userId));
}

function readActiveSessionFor(routeId: string, userId: string) {
  const active = readActiveSession(userId);
  return active?.routeId === routeId ? active : null;
}

export function writeStoredSession(session: StoredSession) {
  if (typeof window === "undefined" || !session.userId) return;
  const payload = JSON.stringify(session);
  window.localStorage.setItem(sessionKey(session.routeId, session.userId), payload);
  window.localStorage.setItem(activeKey(session.userId), payload);
}

export function clearUserSessionKeys(userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_ACTIVE_KEY);
  if (!userId) return;
  const prefix = `mysterybox.session.${userId}.`;
  const active = activeKey(userId);
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && (key === active || key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function clearStoredSession(routeId?: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  if (userId && routeId) {
    window.localStorage.removeItem(sessionKey(routeId, userId));
    const active = readActiveSession(userId);
    if (active?.routeId === routeId) {
      window.localStorage.removeItem(activeKey(userId));
    }
    return;
  }
  if (userId) {
    window.localStorage.removeItem(activeKey(userId));
  }
  window.localStorage.removeItem(LEGACY_ACTIVE_KEY);
}

export async function validateStoredSession(
  routeId: string,
  caseId: string,
  userId: string
) {
  const stored = readStoredSession(routeId, userId);
  if (!stored) return null;

  try {
    const session = await getSession(stored.sessionId);
    if (session.case_id !== caseId || (session.user_id && session.user_id !== userId)) {
      clearStoredSession(routeId, userId);
      return null;
    }
    writeStoredSession({
      sessionId: session.id,
      caseId: session.case_id,
      routeId,
      userId,
    });
    return session;
  } catch (error) {
    if (error instanceof ApiError) {
      clearStoredSession(routeId, userId);
      return null;
    }
    throw error;
  }
}

export async function startInvestigationSession(
  routeId: string,
  caseId: string,
  userId: string
) {
  const existing = await validateStoredSession(routeId, caseId, userId);
  if (existing?.status === "in_progress") {
    return existing;
  }

  const session = await createSession(caseId);
  writeStoredSession({
    sessionId: session.id,
    caseId: session.case_id,
    routeId,
    userId,
  });
  return session;
}

export async function reopenInvestigationSession(
  routeId: string,
  caseId: string,
  userId: string
) {
  const existing = await validateStoredSession(routeId, caseId, userId);
  if (existing) {
    return existing;
  }
  return startInvestigationSession(routeId, caseId, userId);
}

export function persistSession(routeId: string, session: ApiSession, userId: string) {
  writeStoredSession({
    sessionId: session.id,
    caseId: session.case_id,
    routeId,
    userId,
  });
}

import { ApiError, createSession, getProfile, getSession } from "@/lib/api";
import type { ApiSession } from "@/types/api";

const LEGACY_ACTIVE_KEY = "mysterybox.activeSession";
const ACTIVE_USER_KEY = "mysterybox.auth.activeUser";

export function boardStorageKey(userId: string, caseId: string) {
  return `mysterybox.board.${userId}.${caseId}`;
}

export function flowStorageKey(userId: string, caseId: string) {
  return `mysterybox.flow.${userId}.${caseId}`;
}

export function accusationStorageKey(userId: string, caseId: string) {
  return `mysterybox.accusation.${userId}.${caseId}`;
}

function storageKeys(storage: Storage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

function removeMatching(storage: Storage, match: (key: string) => boolean) {
  for (const key of storageKeys(storage)) {
    if (match(key)) storage.removeItem(key);
  }
}

function isLegacyDeskKey(key: string) {
  return (
    key === LEGACY_ACTIVE_KEY ||
    /^mysterybox\.(board|flow|accusation)\.[^.]+$/.test(key)
  );
}

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

export function sweepSharedDeskKeys() {
  if (typeof window === "undefined") return;
  removeMatching(window.localStorage, isLegacyDeskKey);
  removeMatching(window.sessionStorage, isLegacyDeskKey);
}

export function adoptUserDesk(userId: string) {
  if (typeof window === "undefined") return;
  sweepSharedDeskKeys();
  const previous = window.localStorage.getItem(ACTIVE_USER_KEY);
  if (previous && previous !== userId) {
    clearUserSessionKeys(previous);
  }
  window.localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function clearUserSessionKeys(userId?: string | null) {
  if (typeof window === "undefined") return;
  sweepSharedDeskKeys();
  if (!userId) {
    window.localStorage.removeItem(ACTIVE_USER_KEY);
    return;
  }
  const prefixes = [
    `mysterybox.session.${userId}.`,
    `mysterybox.board.${userId}.`,
    `mysterybox.flow.${userId}.`,
    `mysterybox.accusation.${userId}.`,
    `mysterybox.auth.issuedAt.${userId}`,
  ];
  const active = activeKey(userId);
  removeMatching(window.localStorage, (key) => key === active || prefixes.some((prefix) => key.startsWith(prefix)));
  removeMatching(window.sessionStorage, (key) => prefixes.some((prefix) => key.startsWith(prefix)));
  if (window.localStorage.getItem(ACTIVE_USER_KEY) === userId) {
    window.localStorage.removeItem(ACTIVE_USER_KEY);
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

async function resumeFromProfile(routeId: string, caseId: string, userId: string) {
  try {
    const profile = await getProfile();
    const current = profile.stats.currentInvestigation;
    if (current?.caseId === caseId) {
      const session = await getSession(current.sessionId);
      writeStoredSession({
        sessionId: session.id,
        caseId: session.case_id,
        routeId,
        userId,
      });
      return session;
    }
    const closed = profile.stats.recentlySolved.find((item) => item.caseId === caseId);
    if (closed) {
      const session = await getSession(closed.id);
      writeStoredSession({
        sessionId: session.id,
        caseId: session.case_id,
        routeId,
        userId,
      });
      return session;
    }
  } catch {
    return null;
  }
  return null;
}

export async function startInvestigationSession(
  routeId: string,
  caseId: string,
  userId: string
) {
  const existing = await validateStoredSession(routeId, caseId, userId);
  if (existing?.status === "in_progress" || existing?.status === "completed") {
    return existing;
  }

  const resumed = await resumeFromProfile(routeId, caseId, userId);
  if (resumed) {
    return resumed;
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

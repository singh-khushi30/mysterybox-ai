export const SESSION_TTL_MS = 60 * 60 * 1000;
export const ISSUED_COOKIE = "mysterybox_issued_at";

function issuedKey(userId: string) {
  return `mysterybox.auth.issuedAt.${userId}`;
}

function writeIssuedCookie(issuedAt: number) {
  if (typeof document === "undefined") return;
  const remaining = Math.max(1, Math.ceil((SESSION_TTL_MS - (Date.now() - issuedAt)) / 1000));
  document.cookie = `${ISSUED_COOKIE}=${issuedAt}; Path=/; Max-Age=${remaining}; SameSite=Lax`;
}

export function clearIssuedCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${ISSUED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function markAuthIssued(userId: string, reset: boolean) {
  if (typeof window === "undefined") return Date.now();
  const key = issuedKey(userId);
  const existing = Number(window.localStorage.getItem(key));
  const issuedAt =
    !reset && Number.isFinite(existing) && existing > 0 ? existing : Date.now();
  window.localStorage.setItem(key, String(issuedAt));
  writeIssuedCookie(issuedAt);
  return issuedAt;
}

export function readAuthIssued(userId: string) {
  if (typeof window === "undefined") return null;
  const issuedAt = Number(window.localStorage.getItem(issuedKey(userId)));
  return Number.isFinite(issuedAt) && issuedAt > 0 ? issuedAt : null;
}

export function isAuthExpired(userId: string) {
  const issuedAt = readAuthIssued(userId);
  if (!issuedAt) return false;
  return Date.now() - issuedAt >= SESSION_TTL_MS;
}

export function clearAuthIssued(userId?: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    window.localStorage.removeItem(issuedKey(userId));
  } else {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("mysterybox.auth.issuedAt.")) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  }
  clearIssuedCookie();
}

export function issuedCookieIsExpired(value: string | undefined) {
  if (!value) return true;
  const issuedAt = Number(value);
  return !Number.isFinite(issuedAt) || Date.now() - issuedAt >= SESSION_TTL_MS;
}

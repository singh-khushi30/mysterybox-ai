import { getAccessToken } from "@/lib/auth/token";
import type {
  ApiAccusationSubmission,
  ApiCase,
  ApiCaseResult,
  ApiContradiction,
  ApiEvidence,
  ApiFailure,
  ApiInterrogationMessage,
  ApiInterrogationTurn,
  ApiNote,
  ApiProfile,
  ApiSession,
  ApiSuccess,
  ApiSuspect,
  ApiTimelineEvent,
} from "@/types/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const SERVICE_PREFIX = "/api/backend";

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isLoopbackUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

function apiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return SERVICE_PREFIX;
    }
    if (isAbsoluteUrl(configured)) {
      return configured;
    }
    throw new ApiError("The archive address is not configured.", 500);
  }

  if (process.env.VERCEL) {
    const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, "");
    if (vercelHost) {
      return `https://${vercelHost}${SERVICE_PREFIX}`;
    }
    const boundBackend = process.env.BACKEND_URL?.replace(/\/$/, "");
    if (boundBackend) {
      return boundBackend;
    }
  }

  if (isAbsoluteUrl(configured) && !isLoopbackUrl(configured)) {
    return configured;
  }
  if (isAbsoluteUrl(configured)) {
    return configured;
  }

  throw new ApiError("The archive address is not configured.", 500);
}

type RequestOptions = RequestInit & { accessToken?: string | null };

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { accessToken, ...rest } = init ?? {};
  const token = accessToken !== undefined ? accessToken : await getAccessToken();
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      cache: "no-store",
      ...rest,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError("The bureau could not be reached.", 503);
  }

  let payload: ApiSuccess<T> | ApiFailure;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    throw new ApiError("The bureau sent an unreadable file.", response.status);
  }

  if (!response.ok || !payload.success) {
    const message = !payload.success ? payload.error : "The file could not be opened.";
    throw new ApiError(message, response.status);
  }

  return payload.data;
}

export function getCases(accessToken?: string | null) {
  return request<ApiCase[]>("/api/cases", { accessToken });
}

export function getCase(id: string, accessToken?: string | null) {
  return request<ApiCase>(`/api/cases/${id}`, { accessToken });
}

export function getCaseSuspects(caseId: string, accessToken?: string | null) {
  return request<ApiSuspect[]>(`/api/cases/${caseId}/suspects`, { accessToken });
}

export function getSuspect(id: string, accessToken?: string | null) {
  return request<ApiSuspect>(`/api/suspects/${id}`, { accessToken });
}

export function getCaseEvidence(caseId: string, accessToken?: string | null) {
  return request<ApiEvidence[]>(`/api/cases/${caseId}/evidence`, { accessToken });
}

export function getCasePublicEvidence(caseId: string, accessToken?: string | null) {
  return request<ApiEvidence[]>(`/api/cases/${caseId}/evidence/all`, { accessToken });
}

export function getCaseTimeline(caseId: string, accessToken?: string | null) {
  return request<ApiTimelineEvent[]>(`/api/cases/${caseId}/timeline`, { accessToken });
}

export function createSession(caseId: string) {
  return request<ApiSession>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ caseId }),
  });
}

export function getSession(id: string) {
  return request<ApiSession>(`/api/sessions/${id}`);
}

export function completeSession(id: string) {
  return request<ApiSession>(`/api/sessions/${id}/complete`, {
    method: "PATCH",
  });
}

export function getSessionNotes(sessionId: string) {
  return request<ApiNote>(`/api/sessions/${sessionId}/notes`);
}

export function saveSessionNotes(sessionId: string, content: string) {
  return request<ApiNote>(`/api/sessions/${sessionId}/notes`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export function getSessionEvidence(sessionId: string) {
  return request<ApiEvidence[]>(`/api/sessions/${sessionId}/evidence`);
}

export function discoverSessionEvidence(sessionId: string, evidenceId: string) {
  return request<ApiEvidence>(`/api/sessions/${sessionId}/evidence/${evidenceId}/discover`, {
    method: "POST",
  });
}

export function getInterrogation(sessionId: string, suspectId: string) {
  return request<ApiInterrogationMessage[]>(
    `/api/sessions/${sessionId}/interrogations/${suspectId}`
  );
}

export function interrogateSuspect(
  sessionId: string,
  input: { suspectId: string; message: string; evidenceId?: string }
) {
  return request<ApiInterrogationTurn>(`/api/sessions/${sessionId}/interrogate`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerAccount(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  return request<{ id: string; email: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getProfile() {
  return request<ApiProfile>("/api/profile");
}

export function updateProfile(displayName: string) {
  return request<ApiProfile>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
  });
}

export function getSessionContradictions(sessionId: string) {
  return request<ApiContradiction[]>(`/api/sessions/${sessionId}/contradictions`);
}

export function submitAccusation(
  sessionId: string,
  input: {
    suspectId: string;
    motive: string;
    method: string;
    evidenceIds: string[];
    reasoning: string;
  }
) {
  return request<ApiAccusationSubmission>(`/api/sessions/${sessionId}/accusation`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getSessionResult(sessionId: string) {
  return request<ApiCaseResult>(`/api/sessions/${sessionId}/result`);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveCaseId(idOrSlug: string, accessToken?: string | null) {
  if (uuidPattern.test(idOrSlug)) {
    return idOrSlug;
  }

  const cases = await getCases(accessToken);
  const bySlug = cases.find((item) => item.slug === idOrSlug);
  if (bySlug) return bySlug.id;

  const numbered = Number(idOrSlug);
  if (Number.isInteger(numbered) && numbered > 0) {
    return cases.find((item) => item.caseNumber === numbered)?.id ?? null;
  }

  return null;
}

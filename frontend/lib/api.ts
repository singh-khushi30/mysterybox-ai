import type {
  ApiCase,
  ApiContradiction,
  ApiEvidence,
  ApiFailure,
  ApiInterrogationMessage,
  ApiInterrogationTurn,
  ApiNote,
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

function apiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new ApiError("The archive address is not configured.", 500);
  }
  return base;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
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

export function getCases() {
  return request<ApiCase[]>("/api/cases");
}

export function getCase(id: string) {
  return request<ApiCase>(`/api/cases/${id}`);
}

export function getCaseSuspects(caseId: string) {
  return request<ApiSuspect[]>(`/api/cases/${caseId}/suspects`);
}

export function getSuspect(id: string) {
  return request<ApiSuspect>(`/api/suspects/${id}`);
}

export function getCaseEvidence(caseId: string) {
  return request<ApiEvidence[]>(`/api/cases/${caseId}/evidence`);
}

export function getCasePublicEvidence(caseId: string) {
  return request<ApiEvidence[]>(`/api/cases/${caseId}/evidence/all`);
}

export function getEvidence(id: string) {
  return request<ApiEvidence>(`/api/evidence/${id}`);
}

export function getCaseTimeline(caseId: string) {
  return request<ApiTimelineEvent[]>(`/api/cases/${caseId}/timeline`);
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

export function getSessionContradictions(sessionId: string) {
  return request<ApiContradiction[]>(`/api/sessions/${sessionId}/contradictions`);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveCaseId(idOrSlug: string) {
  if (uuidPattern.test(idOrSlug)) {
    return idOrSlug;
  }

  const cases = await getCases();
  const bySlug = cases.find((item) => item.slug === idOrSlug);
  if (bySlug) return bySlug.id;

  if (idOrSlug === "001") {
    return (
      cases.find((item) => item.slug === "the-last-guest-at-blackwood-manor")?.id ??
      cases[0]?.id ??
      null
    );
  }

  return null;
}

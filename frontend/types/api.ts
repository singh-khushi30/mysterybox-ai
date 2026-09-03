export type ApiCase = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  cover_image_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
};

export type ApiSuspect = {
  id: string;
  case_id: string;
  name: string;
  age: number | null;
  occupation: string | null;
  relationship_to_victim: string | null;
  bio: string | null;
  public_alibi: string | null;
  portrait_url: string | null;
  personality: string | null;
  created_at: string;
};

export type ApiEvidence = {
  id: string;
  case_id: string;
  title: string;
  type: "cctv" | "receipt" | "phone" | "photograph" | "statement" | "object";
  description: string;
  file_url: string | null;
  location_found: string | null;
  discovered_by_default: boolean;
  importance: "low" | "medium" | "high" | "critical";
  created_at: string;
};

export type ApiTimelineEvent = {
  id: string;
  case_id: string;
  event_time: string;
  public_description: string;
  related_suspect_id: string | null;
  related_evidence_id: string | null;
  sequence: number;
  created_at: string;
};

export type ApiNote = {
  content: string;
  updated_at: string | null;
};

export type ApiSessionStatus = "in_progress" | "completed" | "abandoned";

export type ApiSession = {
  id: string;
  case_id: string;
  status: ApiSessionStatus;
  started_at: string;
  completed_at: string | null;
  score: number | null;
};

export type ApiInterrogationRole = "detective" | "suspect";

export type ApiInterrogationMessage = {
  id: string;
  session_id: string;
  suspect_id: string;
  role: ApiInterrogationRole;
  content: string;
  created_at: string;
};

export type ApiInterrogationTurn = {
  detective: ApiInterrogationMessage;
  suspect: ApiInterrogationMessage;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

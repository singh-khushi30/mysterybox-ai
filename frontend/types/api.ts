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

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

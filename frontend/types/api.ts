export type ArchiveStatus = "locked" | "available" | "in_progress" | "completed";

export type ApiCase = {
  id: string;
  title: string;
  slug: string;
  description: string;
  teaser: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  cover_image_url: string | null;
  publicationStatus: "draft" | "published" | "archived";
  caseNumber: number;
  unlockOrder: number;
  status: ArchiveStatus;
  score: number | null;
  completedAt: string | null;
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
  user_id?: string | null;
  status: ApiSessionStatus;
  started_at: string;
  completed_at: string | null;
  score: number | null;
};

export type ApiProfileStats = {
  completedCases: number;
  totalCases: number;
  averageScore: number;
  accuracy: number;
  currentInvestigation: {
    sessionId: string;
    caseId: string;
    title: string;
    slug: string;
    caseNumber?: number | null;
  } | null;
  recentlySolved: Array<{
    id: string;
    caseId?: string;
    title: string;
    year: string;
    completedAt?: string | null;
    score: number;
    correct?: boolean;
  }>;
};

export type ApiProfile = {
  id: string;
  displayName: string;
  detectiveRank: string;
  avatarUrl: string | null;
  createdAt: string;
  stats: ApiProfileStats;
  achievements: Array<{ id: string; title: string; detail: string }>;
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

export type ApiContradictionFlag = {
  detected: boolean;
  explanation: string;
};

export type ApiInterrogationTurn = {
  detective: ApiInterrogationMessage;
  suspect: ApiInterrogationMessage;
  contradiction?: ApiContradictionFlag;
};

export type ApiContradiction = {
  id: string;
  session_id: string;
  suspect_id: string;
  statement: string;
  evidence_id: string | null;
  explanation: string;
  confidence: number;
  discovered_at: string;
};

export type ApiAccusationScores = {
  culprit: number;
  evidence: number;
  motive: number;
  reasoning: number;
  total: number;
};

export type ApiAccusationSubmission = {
  id: string;
  sessionId: string;
  suspectId: string;
  culpritCorrect: boolean;
  scores: ApiAccusationScores;
  session: ApiSession;
};

export type ApiCaseResult = {
  culpritCorrect: boolean;
  totalScore: number;
  rank: string;
  breakdown: {
    culprit: number;
    evidence: number;
    motive: number;
    reasoning: number;
  };
  actual: {
    culpritId: string;
    culpritName: string;
    motive: string;
    method: string;
    explanation: string;
  };
  submitted: {
    suspectId: string;
    suspectName: string;
    motive: string;
    method: string;
    reasoning: string;
    evidence: Array<{ id: string; title: string }>;
  };
  feedback: string;
  session: {
    id: string;
    status: "completed";
    score: number;
    completed_at: string | null;
  };
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

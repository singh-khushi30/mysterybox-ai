export type CaseDifficulty = "Easy" | "Medium" | "Hard";

export type SuspicionStatus = "unclear" | "watching" | "elevated" | "cleared";

export type EvidenceKind =
  | "cctv"
  | "receipt"
  | "phone"
  | "photograph"
  | "statement"
  | "object";

export type Victim = {
  name: string;
  role: string;
  initials: string;
  summary: string;
};

export type Suspect = {
  id: string;
  name: string;
  initials: string;
  role: string;
  relationship: string;
  bio: string;
  background: string;
  alibi: string;
  suspicion: SuspicionStatus;
  questioned: boolean;
  connectedEvidenceIds: string[];
};

export type Evidence = {
  id: string;
  fileNumber: string;
  title: string;
  kind: EvidenceKind;
  description: string;
  timestamp: string;
  location: string;
  relatedSuspectId: string | null;
  discovered: boolean;
  imageLabel: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  suspectId: string | null;
};

export type Case = {
  id: string;
  backendId: string;
  number: string;
  title: string;
  difficulty: CaseDifficulty;
  duration: string;
  location: string;
  date: string;
  summary: string;
  victim: Victim;
  suspects: Suspect[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
};

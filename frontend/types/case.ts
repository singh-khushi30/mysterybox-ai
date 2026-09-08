import type { ArchiveStatus } from "@/types/api";

export type CaseDifficulty = "Easy" | "Medium" | "Hard";

export type CaseSuspect = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

export type CaseFile = {
  id: string;
  backendId?: string;
  number: string;
  title: string;
  locked: boolean;
  comingSoon: boolean;
  archiveStatus?: ArchiveStatus;
  score?: number | null;
  completedAt?: string | null;
  difficulty?: CaseDifficulty;
  duration?: string;
  suspectCount?: number;
  clueCount?: number;
  location?: string;
  date?: string;
  summary?: string;
  victim?: {
    name: string;
    role: string;
    initials: string;
  };
  suspects?: CaseSuspect[];
  evidence?: string[];
};

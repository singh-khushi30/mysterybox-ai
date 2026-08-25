export type CaseDifficulty = "Easy" | "Medium" | "Hard";

export type CaseSuspect = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

export type CaseFile = {
  id: string;
  number: string;
  title: string;
  locked: boolean;
  comingSoon: boolean;
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

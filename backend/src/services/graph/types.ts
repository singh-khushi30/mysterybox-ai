import type { RetrievalHit } from "../rag/retrieve.js";

export type InterrogationMessage = {
  id: string;
  session_id: string;
  suspect_id: string;
  role: "detective" | "suspect";
  content: string;
  created_at: string;
};

export const MAX_REPAIR_ATTEMPTS = 2;

export const SAFE_FALLBACK =
  "I don't remember that clearly enough to swear to it.";

export type ValidationResult = {
  valid: boolean;
  reasons: string[];
};

export type PublicFact = {
  kind: "evidence" | "timeline" | "alibi" | "statement";
  id: string | null;
  evidenceId: string | null;
  suspectId: string | null;
  minutes: number | null;
  locationKeys: string[];
  text: string;
};

export type ContradictionHit = {
  detected: boolean;
  explanation: string;
  confidence: number;
  evidenceId: string | null;
  fingerprint: string;
  statement: string;
  duplicate: boolean;
};

export type SuspectIdentity = {
  id: string;
  case_id: string;
  name: string;
  occupation: string | null;
  relationship_to_victim: string | null;
  personality: string | null;
  public_alibi: string | null;
};

export type InterrogationGraphInput = {
  sessionId: string;
  suspectId: string;
  message: string;
  evidenceId?: string;
  forcedReply?: string;
};

export type InterrogationGraphState = InterrogationGraphInput & {
  caseId: string;
  detectiveContent: string;
  identity: SuspectIdentity | null;
  knowledge: RetrievalHit[];
  history: InterrogationMessage[];
  publicFacts: PublicFact[];
  allowedText: string;
  draft: string;
  repairCount: number;
  validation: ValidationResult;
  contradiction: ContradictionHit;
  detectiveMessage: InterrogationMessage | null;
  suspectMessage: InterrogationMessage | null;
};

export const emptyContradiction = (): ContradictionHit => ({
  detected: false,
  explanation: "",
  confidence: 0,
  evidenceId: null,
  fingerprint: "",
  statement: "",
  duplicate: false,
});

export const emptyValidation = (): ValidationResult => ({
  valid: true,
  reasons: [],
});

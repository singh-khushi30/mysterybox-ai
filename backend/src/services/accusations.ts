import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { refreshDetectiveRank } from "./profiles.js";
import { getSession } from "./sessions.js";
import { getSuspect } from "./suspects.js";
import {
  evaluateAccusation,
  feedbackForScore,
  rankFromScore,
  type GroundTruth,
  type ScoringEvidence,
} from "./scoring.js";

const ACCUSATION_FIELDS =
  "id, session_id, suspect_id, motive, method, reasoning, submitted_evidence, culprit_correct, culprit_score, evidence_score, motive_score, reasoning_score, total_score, created_at";

const GROUND_TRUTH_FIELDS =
  "case_id, culprit_id, motive, method, location, solution_explanation";

const SCORING_EVIDENCE_FIELDS = "id, case_id, title, importance, is_red_herring";

export type SubmittedAccusation = {
  suspectId: string;
  motive: string;
  method: string;
  evidenceIds: string[];
  reasoning: string;
};

type AccusationRow = {
  id: string;
  session_id: string;
  suspect_id: string;
  motive: string;
  method: string;
  reasoning: string;
  submitted_evidence: string[];
  culprit_correct: boolean;
  culprit_score: number;
  evidence_score: number;
  motive_score: number;
  reasoning_score: number;
  total_score: number;
  created_at: string;
};

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /accusations/i.test(error.message ?? "")
  );
}

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}

async function getAccusationForSession(
  sessionId: string,
  options?: { requireLedger?: boolean }
) {
  const { data, error } = await supabase
    .from("accusations")
    .select(ACCUSATION_FIELDS)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) {
      if (options?.requireLedger === false) {
        return null;
      }
      throw new HttpError(503, "The accusation ledger is not available.");
    }
    throw new HttpError(500, "Unable to read the accusation file");
  }

  return (data as AccusationRow | null) ?? null;
}

async function loadGroundTruth(caseId: string): Promise<GroundTruth> {
  const { data, error } = await supabase
    .from("case_ground_truth")
    .select(GROUND_TRUTH_FIELDS)
    .eq("case_id", caseId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to close the case");
  }
  if (!data) {
    throw new HttpError(500, "Unable to close the case");
  }

  return data;
}

async function loadScoringEvidence(caseId: string): Promise<ScoringEvidence[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select(SCORING_EVIDENCE_FIELDS)
    .eq("case_id", caseId);

  if (error || !data) {
    throw new HttpError(500, "Unable to score the files");
  }

  return data;
}

async function loadEvidenceByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("evidence")
    .select("id, case_id, title")
    .in("id", ids);

  if (error) {
    throw new HttpError(500, "Unable to read the sealed files");
  }

  return data ?? [];
}

async function completeSessionWithScore(sessionId: string, score: number, userId?: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      score,
    })
    .eq("id", sessionId)
    .eq("status", "in_progress")
    .select("id, case_id, user_id, status, started_at, completed_at, score")
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Unable to close the investigation");
  }

  if (data) {
    return data;
  }

  return getSession(sessionId, userId);
}

function toPublicSubmission(row: AccusationRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    suspectId: row.suspect_id,
    culpritCorrect: row.culprit_correct,
    scores: {
      culprit: row.culprit_score,
      evidence: row.evidence_score,
      motive: row.motive_score,
      reasoning: row.reasoning_score,
      total: row.total_score,
    },
  };
}

export async function submitAccusation(
  sessionId: string,
  input: SubmittedAccusation,
  userId?: string
) {
  const session = await getSession(sessionId, userId);
  const existing = await getAccusationForSession(sessionId);

  if (existing) {
    if (session.status !== "completed") {
      await completeSessionWithScore(sessionId, existing.total_score, userId);
    }
    throw new HttpError(409, "An accusation has already been sealed.");
  }

  if (session.status !== "in_progress") {
    throw new HttpError(409, "This investigation is no longer open.");
  }

  const evidenceIds = [...new Set(input.evidenceIds)];
  const [suspect, foundEvidence, truth, catalog] = await Promise.all([
    getSuspect(input.suspectId),
    loadEvidenceByIds(evidenceIds),
    loadGroundTruth(session.case_id),
    loadScoringEvidence(session.case_id),
  ]);

  if (suspect.case_id !== session.case_id) {
    throw new HttpError(400, "Suspect does not belong to this case");
  }

  if (foundEvidence.length !== evidenceIds.length) {
    throw new HttpError(400, "One or more evidence files are not on this case");
  }

  const foreign = foundEvidence.find((item) => item.case_id !== session.case_id);
  if (foreign) {
    throw new HttpError(400, "Evidence does not belong to this case");
  }

  const scored = await evaluateAccusation({
    suspectId: input.suspectId,
    motive: input.motive,
    method: input.method,
    evidenceIds,
    reasoning: input.reasoning,
    truth,
    catalog,
    allowGemini: process.env.ACCUSATION_SKIP_GEMINI !== "1",
  });

  const { data, error } = await supabase
    .from("accusations")
    .insert({
      session_id: sessionId,
      suspect_id: input.suspectId,
      motive: input.motive,
      method: input.method,
      reasoning: input.reasoning,
      submitted_evidence: evidenceIds,
      culprit_correct: scored.culpritCorrect,
      culprit_score: scored.culprit,
      evidence_score: scored.evidence,
      motive_score: scored.motive,
      reasoning_score: scored.reasoning,
      total_score: scored.total,
    })
    .select(ACCUSATION_FIELDS)
    .single();

  if (error || !data) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "An accusation has already been sealed.");
    }
    if (isMissingTable(error)) {
      throw new HttpError(503, "The accusation ledger is not available.");
    }
    throw new HttpError(500, "Unable to seal the accusation");
  }

  let closed = await completeSessionWithScore(sessionId, scored.total, userId);
  if (closed.status !== "completed") {
    closed = await completeSessionWithScore(sessionId, scored.total, userId);
  }
  if (closed.status !== "completed") {
    throw new HttpError(500, "The accusation was sealed, but the investigation could not be closed.");
  }
  const ownerId = userId ?? session.user_id;
  if (ownerId) {
    await refreshDetectiveRank(ownerId);
  }
  const row = data as AccusationRow;

  return {
    ...toPublicSubmission(row),
    session: closed,
  };
}

export async function getSessionResult(sessionId: string, userId?: string) {
  const session = await getSession(sessionId, userId);
  const accusation = await getAccusationForSession(sessionId, {
    requireLedger: session.status === "completed",
  });

  if (!accusation) {
    if (session.status !== "completed") {
      throw new HttpError(409, "The investigation is still open.");
    }
    throw new HttpError(409, "No accusation is on file.");
  }

  if (session.status !== "completed") {
    await completeSessionWithScore(sessionId, accusation.total_score, userId);
  }

  const [truth, accused, submittedEvidence, catalog] = await Promise.all([
    loadGroundTruth(session.case_id),
    getSuspect(accusation.suspect_id),
    loadEvidenceByIds(accusation.submitted_evidence ?? []),
    loadScoringEvidence(session.case_id),
  ]);

  const actualCulprit =
    accused.id === truth.culprit_id ? accused : await getSuspect(truth.culprit_id);

  const redHerringCount = (accusation.submitted_evidence ?? []).filter((id) =>
    catalog.find((item) => item.id === id)?.is_red_herring
  ).length;

  return {
    culpritCorrect: accusation.culprit_correct,
    totalScore: accusation.total_score,
    rank: rankFromScore(accusation.total_score),
    breakdown: {
      culprit: accusation.culprit_score,
      evidence: accusation.evidence_score,
      motive: accusation.motive_score,
      reasoning: accusation.reasoning_score,
    },
    actual: {
      culpritId: truth.culprit_id,
      culpritName: actualCulprit.name,
      motive: truth.motive,
      method: truth.method,
      explanation: truth.solution_explanation,
    },
    submitted: {
      suspectId: accusation.suspect_id,
      suspectName: accused.name,
      motive: accusation.motive,
      method: accusation.method,
      reasoning: accusation.reasoning,
      evidence: submittedEvidence.map((item) => ({
        id: item.id,
        title: item.title,
      })),
    },
    feedback: feedbackForScore({
      culpritCorrect: accusation.culprit_correct,
      evidenceScore: accusation.evidence_score,
      motiveScore: accusation.motive_score,
      redHerringCount,
    }),
    session: {
      id: session.id,
      status: "completed" as const,
      score: accusation.total_score,
      completed_at: session.completed_at,
    },
  };
}

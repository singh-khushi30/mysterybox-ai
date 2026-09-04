import { z } from "zod";
import { getGeminiChatModels, readGeminiApiKey } from "../config/gemini.js";

const GEMINI_SCORE_TIMEOUT_MS = 8000;

export const CULPRIT_POINTS = 40;
export const EVIDENCE_POINTS = 25;
export const MOTIVE_POINTS = 15;
export const REASONING_POINTS = 20;

export type ScoringEvidence = {
  id: string;
  title: string;
  importance: "low" | "medium" | "high" | "critical";
  is_red_herring: boolean;
};

export type GroundTruth = {
  culprit_id: string;
  motive: string;
  method: string;
  location: string;
  solution_explanation: string;
};

export type ScoreBreakdown = {
  culprit: number;
  evidence: number;
  motive: number;
  reasoning: number;
  total: number;
};

export type AccusationScore = ScoreBreakdown & {
  culpritCorrect: boolean;
  supportingEvidenceIds: string[];
  matchedEvidenceIds: string[];
  redHerringIds: string[];
  usedGemini: boolean;
};

const geminiScoreSchema = z.object({
  motiveScore: z.number(),
  reasoningScore: z.number(),
});

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "was",
  "were",
  "that",
  "this",
  "from",
  "his",
  "her",
  "he",
  "she",
  "it",
  "not",
  "as",
  "by",
  "at",
  "is",
  "be",
]);

const CORRECT_MOTIVE_ALIASES = [
  "a letter edmund refused to return",
  "private correspondence",
  "unsigned letter",
];

const CORRECT_METHOD_ALIASES = [
  "broken champagne coupe",
  "champagne coupe",
  "the champagne coupe, already cracked",
];

const REASONING_HINTS = [
  "letter",
  "correspondence",
  "unsigned",
  "coupe",
  "champagne",
  "conservatory",
  "glasshouse",
  "11:17",
  "1117",
  "soil",
  "print",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value: number, min: number, max: number) {
  return Math.round(clamp(value, min, max));
}

export function isSupportingEvidence(item: ScoringEvidence) {
  return !item.is_red_herring && (item.importance === "critical" || item.importance === "high");
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9:\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(text: string) {
  return new Set(
    normalize(text)
      .split(" ")
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
  );
}

function coverage(player: string, expected: string) {
  const have = tokens(player);
  const need = tokens(expected);
  if (need.size === 0) return 0;
  let hits = 0;
  for (const token of need) {
    if (have.has(token)) hits += 1;
  }
  return hits / need.size;
}

function matchesAlias(player: string, aliases: string[]) {
  const haystack = normalize(player);
  return aliases.some((alias) => haystack.includes(alias) || alias.includes(haystack));
}

export function scoreCulprit(suspectId: string, culpritId: string) {
  const correct = suspectId === culpritId;
  return {
    culpritCorrect: correct,
    culpritScore: correct ? CULPRIT_POINTS : 0,
  };
}

export function scoreEvidence(submittedIds: string[], catalog: ScoringEvidence[]) {
  const unique = [...new Set(submittedIds)];
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const supporting = catalog.filter(isSupportingEvidence);
  const supportingIds = supporting.map((item) => item.id);
  const matched = unique.filter((id) => supportingIds.includes(id));
  const redHerringIds = unique.filter((id) => byId.get(id)?.is_red_herring);

  const evidenceScore =
    supportingIds.length === 0
      ? 0
      : clampInt((EVIDENCE_POINTS * matched.length) / supportingIds.length, 0, EVIDENCE_POINTS);

  return {
    evidenceScore,
    supportingEvidenceIds: supportingIds,
    matchedEvidenceIds: matched,
    redHerringIds,
  };
}

export function scoreMotiveDeterministic(motive: string, method: string, truth: GroundTruth) {
  const motiveRatio = matchesAlias(motive, CORRECT_MOTIVE_ALIASES)
    ? 1
    : coverage(motive, truth.motive);
  const methodRatio = matchesAlias(method, CORRECT_METHOD_ALIASES)
    ? 1
    : coverage(method, truth.method);

  return clampInt(MOTIVE_POINTS * (0.6 * motiveRatio + 0.4 * methodRatio), 0, MOTIVE_POINTS);
}

export function scoreReasoningDeterministic(reasoning: string, truth: GroundTruth) {
  const expected = [truth.solution_explanation, truth.motive, truth.method, truth.location].join(
    " "
  );
  const overlap = coverage(reasoning, expected);
  const haystack = normalize(reasoning);
  const hintHits = REASONING_HINTS.filter((hint) => haystack.includes(hint)).length;
  const hintRatio = hintHits / REASONING_HINTS.length;
  return clampInt(REASONING_POINTS * (0.55 * overlap + 0.45 * hintRatio), 0, REASONING_POINTS);
}

function extractJsonObject(raw: string) {
  const fenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(fenced.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

async function scoreFreeTextWithGemini(input: {
  motive: string;
  method: string;
  reasoning: string;
  truth: GroundTruth;
}): Promise<{ motiveScore: number; reasoningScore: number } | null> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey });
    const systemInstruction = [
      "You score a detective's written motive and reasoning against short expected facts.",
      'Return ONLY JSON: {"motiveScore": number, "reasoningScore": number}.',
      `motiveScore must be an integer from 0 to ${MOTIVE_POINTS}.`,
      `reasoningScore must be an integer from 0 to ${REASONING_POINTS}.`,
      "Score semantic agreement with the expected motive and method only.",
      "Do not decide whether the accused person is guilty.",
      "Do not mention a culprit name in the JSON.",
    ].join(" ");
    const userText = [
      `Expected motive: ${input.truth.motive}`,
      `Expected method: ${input.truth.method}`,
      `Expected place: ${input.truth.location}`,
      `Player motive: ${input.motive}`,
      `Player method: ${input.method}`,
      `Player reasoning: ${input.reasoning}`,
    ].join("\n");

    let raw = "";
    for (const model of getGeminiChatModels()) {
      try {
        const response = await Promise.race([
          client.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: userText }] }],
            config: {
              systemInstruction,
              temperature: 0.1,
              maxOutputTokens: 120,
            },
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("timeout")), GEMINI_SCORE_TIMEOUT_MS);
          }),
        ]);
        raw = String(response.text ?? "").trim();
        if (raw) break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/404|NOT_FOUND|not found|unknown model/i.test(message)) {
          return null;
        }
      }
    }

    const parsed = geminiScoreSchema.safeParse(extractJsonObject(raw));
    if (!parsed.success) {
      return null;
    }

    return {
      motiveScore: clampInt(parsed.data.motiveScore, 0, MOTIVE_POINTS),
      reasoningScore: clampInt(parsed.data.reasoningScore, 0, REASONING_POINTS),
    };
  } catch {
    return null;
  }
}

export async function evaluateAccusation(input: {
  suspectId: string;
  motive: string;
  method: string;
  evidenceIds: string[];
  reasoning: string;
  truth: GroundTruth;
  catalog: ScoringEvidence[];
  allowGemini?: boolean;
}): Promise<AccusationScore> {
  const culprit = scoreCulprit(input.suspectId, input.truth.culprit_id);
  const evidence = scoreEvidence(input.evidenceIds, input.catalog);

  let motiveScore = scoreMotiveDeterministic(input.motive, input.method, input.truth);
  let reasoningScore = scoreReasoningDeterministic(input.reasoning, input.truth);
  let usedGemini = false;

  if (input.allowGemini !== false) {
    const gemini = await scoreFreeTextWithGemini({
      motive: input.motive,
      method: input.method,
      reasoning: input.reasoning,
      truth: input.truth,
    });
    if (gemini) {
      motiveScore = gemini.motiveScore;
      reasoningScore = gemini.reasoningScore;
      usedGemini = true;
    }
  }

  const total = clampInt(
    culprit.culpritScore + evidence.evidenceScore + motiveScore + reasoningScore,
    0,
    100
  );

  return {
    culpritCorrect: culprit.culpritCorrect,
    culprit: culprit.culpritScore,
    evidence: evidence.evidenceScore,
    motive: motiveScore,
    reasoning: reasoningScore,
    total,
    supportingEvidenceIds: evidence.supportingEvidenceIds,
    matchedEvidenceIds: evidence.matchedEvidenceIds,
    redHerringIds: evidence.redHerringIds,
    usedGemini,
  };
}

export function rankFromScore(score: number) {
  if (score >= 90) return "Chief Inspector";
  if (score >= 75) return "Inspector";
  if (score >= 60) return "Sergeant";
  if (score >= 40) return "Constable";
  return "Probationer";
}

export function feedbackForScore(input: {
  culpritCorrect: boolean;
  evidenceScore: number;
  motiveScore: number;
  redHerringCount: number;
}) {
  if (input.culpritCorrect && input.evidenceScore >= 20 && input.motiveScore >= 10) {
    return "The seal holds. The files you attached name the last guest and the instrument.";
  }
  if (input.culpritCorrect && input.evidenceScore < 10) {
    return "The name is right. The files you sealed do not carry the hour or the instrument.";
  }
  if (input.culpritCorrect) {
    return "The name is right. A fuller file would have carried a higher mark.";
  }
  if (input.redHerringCount > 0) {
    return "The name on the paper is not the last guest. One or more files lead away from the conservatory.";
  }
  return "The name on the paper is not the last guest. The true file is below.";
}


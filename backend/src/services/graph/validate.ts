import {
  MAX_REPAIR_ATTEMPTS,
  SAFE_FALLBACK,
  type SuspectIdentity,
  type ValidationResult,
} from "./types.js";

export function nextValidationRoute(valid: boolean, repairCount: number) {
  if (valid) return "detectContradiction";
  if (repairCount >= MAX_REPAIR_ATTEMPTS) return "fallbackResponse";
  return "repairResponse";
}
import type { RetrievalHit } from "../rag/retrieve.js";

const LEAK =
  /ground truth|official solution|isolde hart is the last guest|i killed|i murdered|i am the murderer|culprit id/i;

const IGNORED_NAMES = new Set([
  "detective",
  "inspector",
  "doctor",
  "vale",
  "blackwood",
  "manor",
  "edmund",
  "hart",
  "rowe",
  "pike",
]);

function allowedCorpus(identity: SuspectIdentity, knowledge: RetrievalHit[], extra: string) {
  return [
    identity.name,
    identity.occupation ?? "",
    identity.relationship_to_victim ?? "",
    identity.personality ?? "",
    identity.public_alibi ?? "",
    extra,
    ...knowledge.map((hit) => hit.content),
  ]
    .join("\n")
    .toLowerCase();
}

function extractProperNames(text: string) {
  return [...text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g)].map((match) => match[1]);
}

function extractClockStamps(text: string) {
  return [...text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)].map((match) => match[0]);
}

export function validateSuspectReply(input: {
  reply: string;
  identity: SuspectIdentity;
  knowledge: RetrievalHit[];
  allowedText: string;
}): ValidationResult {
  const reasons: string[] = [];
  const reply = input.reply.trim();

  if (!reply) {
    return { valid: false, reasons: ["empty"] };
  }

  if (LEAK.test(reply)) {
    reasons.push("solution-leak");
  }

  const corpus = allowedCorpus(input.identity, input.knowledge, input.allowedText);

  for (const name of extractProperNames(reply)) {
    const parts = name.toLowerCase().split(/\s+/);
    const known = parts.every((part) => corpus.includes(part) || IGNORED_NAMES.has(part));
    if (!known) {
      reasons.push(`unsupported-person:${name}`);
    }
  }

  for (const stamp of extractClockStamps(reply)) {
    if (!corpus.includes(stamp.toLowerCase()) && !input.allowedText.toLowerCase().includes(stamp)) {
      reasons.push(`unsupported-time:${stamp}`);
    }
  }

  if (/\blibrary\b/i.test(reply) && !corpus.includes("library")) {
    reasons.push("unsupported-location:library");
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}

export function fallbackReply() {
  return SAFE_FALLBACK;
}

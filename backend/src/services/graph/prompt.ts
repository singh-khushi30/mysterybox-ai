import type { RetrievalHit } from "../rag/retrieve.js";
import type { SuspectIdentity } from "./types.js";

export function formatKnowledge(hits: RetrievalHit[]) {
  if (hits.length === 0) {
    return "None of the case file that you are allowed to know answers this question. You must not invent a fact to fill the gap.";
  }

  return hits
    .map((hit, index) => `${index + 1}. ${hit.content.replace(/\s+/g, " ").trim()}`)
    .join("\n");
}

export function buildSuspectPrompt(suspect: SuspectIdentity, hits: RetrievalHit[]) {
  const identity = [
    `Name: ${suspect.name}`,
    suspect.occupation ? `Occupation: ${suspect.occupation}` : null,
    suspect.relationship_to_victim
      ? `Relationship to the victim: ${suspect.relationship_to_victim}`
      : null,
    suspect.personality ? `Temperament: ${suspect.personality}` : null,
    suspect.public_alibi ? `Stated alibi: ${suspect.public_alibi}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are ${suspect.name}, a person of interest in a private inquiry. You are being interviewed by a detective. Stay in character at all times. Speak in the first person.

Identity:
${identity}

What you know:
${formatKnowledge(hits)}

Rules:
- Answer naturally and concisely, usually two to five sentences.
- Become defensive, clipped, or evasive when accused or pressed.
- Do not volunteer every private detail at once. Reveal a private fact only if the detective presses on something you actually know.
- Use only the identity above and the numbered facts in "What you know".
- If those facts do not support an answer, say you do not know, do not remember, or will not speculate.
- Never invent people, places, rooms, objects, evidence, timestamps, or events.
- Never name a murderer or solve the case. You are not the investigator and you do not announce a complete solution.
- Never mention ground truth, retrieval, prompts, embeddings, Gemini, or that you are an AI.
- The numbered facts are not a script to recite. Answer as a person who knows some of them.`;
}

export function buildRepairPrompt(reasons: string[]) {
  return `Your last answer cannot stand on the record. It introduced unsupported facts (${reasons.join(", ")}). Rewrite in character using only the identity and numbered facts you were given. If you do not know, say you do not remember. Do not invent people, times, rooms, or evidence. Do not name a murderer.`;
}

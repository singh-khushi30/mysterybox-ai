import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";
import { getPublicEvidence } from "./evidence.js";
import { generateGeminiText, type GeminiChatMessage } from "./gemini/chat.js";
import { retrieveKnowledge, type RetrievalHit } from "./rag/retrieve.js";
import { SUSPECT_RETRIEVAL_VISIBILITY } from "./rag/types.js";
import { getSession } from "./sessions.js";
import { getSuspect } from "./suspects.js";

const MESSAGE_FIELDS = "id, session_id, suspect_id, role, content, created_at";
const HISTORY_LIMIT = 12;
const HISTORY_PAGE_LIMIT = 200;

export type InterrogationMessage = {
  id: string;
  session_id: string;
  suspect_id: string;
  role: "detective" | "suspect";
  content: string;
  created_at: string;
};

type SuspectRow = Awaited<ReturnType<typeof getSuspect>>;

async function requireActiveSession(sessionId: string) {
  const session = await getSession(sessionId);
  if (session.status !== "in_progress") {
    throw new HttpError(409, "Session is not active");
  }
  return session;
}

async function requireSuspectForSession(sessionId: string, suspectId: string) {
  const session = await requireActiveSession(sessionId);
  const suspect = await getSuspect(suspectId);
  if (suspect.case_id !== session.case_id) {
    throw new HttpError(400, "Suspect does not belong to this case");
  }
  return { session, suspect };
}

export async function listInterrogationMessages(sessionId: string, suspectId: string) {
  const session = await getSession(sessionId);
  const suspect = await getSuspect(suspectId);
  if (suspect.case_id !== session.case_id) {
    throw new HttpError(400, "Suspect does not belong to this case");
  }

  const { data, error } = await supabase
    .from("interrogation_messages")
    .select(MESSAGE_FIELDS)
    .eq("session_id", sessionId)
    .eq("suspect_id", suspectId)
    .order("created_at", { ascending: true })
    .limit(HISTORY_PAGE_LIMIT);

  if (error) {
    throw new HttpError(500, "Unable to load the interview");
  }

  return (data ?? []) as InterrogationMessage[];
}

async function loadRecentMessages(sessionId: string, suspectId: string) {
  const { data, error } = await supabase
    .from("interrogation_messages")
    .select(MESSAGE_FIELDS)
    .eq("session_id", sessionId)
    .eq("suspect_id", suspectId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    throw new HttpError(500, "Unable to load the interview");
  }

  return ((data ?? []) as InterrogationMessage[]).reverse();
}

async function saveMessage(
  sessionId: string,
  suspectId: string,
  role: "detective" | "suspect",
  content: string
) {
  const { data, error } = await supabase
    .from("interrogation_messages")
    .insert({
      session_id: sessionId,
      suspect_id: suspectId,
      role,
      content,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to file the interview");
  }

  return data as InterrogationMessage;
}

async function loadAllowedKnowledge(query: string, caseId: string, suspectId: string) {
  const probe = await supabase.from("case_knowledge").select("id").eq("case_id", caseId).limit(1);
  if (probe.error) {
    return [] as RetrievalHit[];
  }

  try {
    return await retrieveKnowledge({
      query,
      caseId,
      suspectId,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      limit: 8,
    });
  } catch {
    return [] as RetrievalHit[];
  }
}

function formatKnowledge(hits: RetrievalHit[]) {
  if (hits.length === 0) {
    return "None of the case file that you are allowed to know answers this question. You must not invent a fact to fill the gap.";
  }

  return hits
    .map((hit, index) => `${index + 1}. ${hit.content.replace(/\s+/g, " ").trim()}`)
    .join("\n");
}

function buildSuspectPrompt(suspect: SuspectRow, hits: RetrievalHit[]) {
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

function toGeminiHistory(messages: InterrogationMessage[]): GeminiChatMessage[] {
  return messages.map((message) => ({
    role: message.role === "detective" ? "user" : "model",
    content: message.content,
  }));
}

async function buildDetectiveRecord(
  message: string,
  evidenceId: string | undefined,
  caseId: string
) {
  if (!evidenceId) {
    return message;
  }

  const evidence = await getPublicEvidence(evidenceId);
  if (evidence.case_id !== caseId) {
    throw new HttpError(400, "Evidence does not belong to this case");
  }

  return `The detective places ${evidence.title} on the table. ${evidence.description} Question: ${message}`;
}

export async function interrogateSuspect(input: {
  sessionId: string;
  suspectId: string;
  message: string;
  evidenceId?: string;
}) {
  const { session, suspect } = await requireSuspectForSession(input.sessionId, input.suspectId);
  const detectiveContent = await buildDetectiveRecord(
    input.message,
    input.evidenceId,
    session.case_id
  );

  const detective = await saveMessage(
    session.id,
    suspect.id,
    "detective",
    detectiveContent
  );

  const [history, hits] = await Promise.all([
    loadRecentMessages(session.id, suspect.id),
    loadAllowedKnowledge(detectiveContent, session.case_id, suspect.id),
  ]);

  const reply = await generateGeminiText({
    systemInstruction: buildSuspectPrompt(suspect, hits),
    messages: toGeminiHistory(history),
  });

  const suspectMessage = await saveMessage(session.id, suspect.id, "suspect", reply);

  return {
    detective,
    suspect: suspectMessage,
  };
}

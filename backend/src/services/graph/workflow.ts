import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { getPublicEvidence, listPublicEvidenceForCase } from "../evidence.js";
import { generateGeminiText, type GeminiChatMessage } from "../gemini/chat.js";
import { retrieveKnowledge, type RetrievalHit } from "../rag/retrieve.js";
import { SUSPECT_RETRIEVAL_VISIBILITY } from "../rag/types.js";
import { listSessionEvidence } from "../session-evidence.js";
import { getSession } from "../sessions.js";
import { getSuspect, listSuspectsForCase } from "../suspects.js";
import { listVisibleTimeline } from "../timeline.js";
import { HttpError } from "../../utils/http.js";
import { supabase } from "../../config/supabase.js";
import { detectContradiction } from "./contradiction.js";
import { extractLocationKeys, factFromText } from "./facts.js";
import { saveContradiction } from "./persist.js";
import { buildRepairPrompt, buildSuspectPrompt } from "./prompt.js";
import {
  emptyContradiction,
  emptyValidation,
  SAFE_FALLBACK,
  type ContradictionHit,
  type InterrogationGraphInput,
  type InterrogationGraphState,
  type InterrogationMessage,
  type PublicFact,
  type SuspectIdentity,
  type ValidationResult,
} from "./types.js";
import { nextValidationRoute, validateSuspectReply } from "./validate.js";

const MESSAGE_FIELDS = "id, session_id, suspect_id, role, content, created_at";
const HISTORY_LIMIT = 12;

const GraphState = Annotation.Root({
  sessionId: Annotation<string>(),
  suspectId: Annotation<string>(),
  message: Annotation<string>(),
  evidenceId: Annotation<string | undefined>(),
  forcedReply: Annotation<string | undefined>(),
  userId: Annotation<string | undefined>(),
  caseId: Annotation<string>(),
  detectiveContent: Annotation<string>(),
  identity: Annotation<SuspectIdentity | null>(),
  knowledge: Annotation<RetrievalHit[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  history: Annotation<InterrogationMessage[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  publicFacts: Annotation<PublicFact[]>({
    reducer: (_left, right) => right,
    default: () => [],
  }),
  allowedText: Annotation<string>(),
  draft: Annotation<string>(),
  repairCount: Annotation<number>(),
  validation: Annotation<ValidationResult>(),
  contradiction: Annotation<ContradictionHit>(),
  detectiveMessage: Annotation<InterrogationMessage | null>(),
  suspectMessage: Annotation<InterrogationMessage | null>(),
});

type GraphStateType = typeof GraphState.State;

async function requireActiveSession(sessionId: string, userId?: string) {
  const session = await getSession(sessionId, userId);
  if (session.status !== "in_progress") {
    throw new HttpError(409, "Session is not active");
  }
  return session;
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

export async function loadRecentMessages(sessionId: string, suspectId: string) {
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

export async function listInterrogationMessages(
  sessionId: string,
  suspectId: string,
  userId?: string
) {
  const session = await getSession(sessionId, userId);
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
    .limit(200);

  if (error) {
    throw new HttpError(500, "Unable to load the interview");
  }

  return (data ?? []) as InterrogationMessage[];
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

async function loadDiscoveredEvidence(sessionId: string, caseId: string, userId?: string) {
  try {
    return await listSessionEvidence(sessionId, userId);
  } catch {
    const catalog = await listPublicEvidenceForCase(caseId);
    return catalog.filter((item) => item.discovered_by_default);
  }
}

async function loadSessionNode(state: GraphStateType) {
  const session = await requireActiveSession(state.sessionId, state.userId);
  const suspect = await getSuspect(state.suspectId);
  if (suspect.case_id !== session.case_id) {
    throw new HttpError(400, "Suspect does not belong to this case");
  }

  let detectiveContent = state.message;
  if (state.evidenceId) {
    const evidence = await getPublicEvidence(state.evidenceId);
    if (evidence.case_id !== session.case_id) {
      throw new HttpError(400, "Evidence does not belong to this case");
    }
    detectiveContent = `The detective places ${evidence.title} on the table. ${evidence.description} Question: ${state.message}`;
  }

  const identity: SuspectIdentity = {
    id: suspect.id,
    case_id: suspect.case_id,
    name: suspect.name,
    occupation: suspect.occupation,
    relationship_to_victim: suspect.relationship_to_victim,
    personality: suspect.personality,
    public_alibi: suspect.public_alibi,
  };

  return {
    caseId: session.case_id,
    detectiveContent,
    identity,
  };
}

async function retrieveNode(state: GraphStateType) {
  const knowledge = await loadAllowedKnowledge(
    state.detectiveContent,
    state.caseId,
    state.suspectId
  );
  return { knowledge };
}

async function loadMemoryNode(state: GraphStateType) {
  const [history, evidence, timeline, suspects] = await Promise.all([
    loadRecentMessages(state.sessionId, state.suspectId),
    loadDiscoveredEvidence(state.sessionId, state.caseId, state.userId),
    listVisibleTimeline(state.caseId),
    listSuspectsForCase(state.caseId),
  ]);

  const publicFacts: PublicFact[] = [
    ...evidence.map((item) => {
      const located = extractLocationKeys(`${item.title} ${item.location_found ?? ""}`);
      return factFromText("evidence", `${item.title}. ${item.description}`, {
        id: item.id,
        evidenceId: item.id,
        locationKeys: located.length > 0 ? located : extractLocationKeys(item.description),
      });
    }),
    ...timeline.map((event) =>
      factFromText("timeline", event.public_description, {
        id: event.id,
        evidenceId: event.related_evidence_id,
        suspectId: event.related_suspect_id,
        minutes: new Date(event.event_time).getUTCHours() * 60 + new Date(event.event_time).getUTCMinutes(),
      })
    ),
    ...(state.identity?.public_alibi
      ? [factFromText("alibi", state.identity.public_alibi, { suspectId: state.suspectId })]
      : []),
    ...history
      .filter((message) => message.role === "suspect")
      .map((message) =>
        factFromText("statement", message.content, {
          id: message.id,
          suspectId: message.suspect_id,
        })
      ),
  ];

  const allowedText = [
    state.identity?.name,
    state.identity?.public_alibi,
    ...suspects.map((item) => `${item.name} ${item.occupation ?? ""}`),
    ...evidence.map((item) => `${item.title} ${item.description}`),
    ...timeline.map((event) => event.public_description),
    ...history.map((message) => message.content),
  ]
    .filter(Boolean)
    .join("\n");

  return { history, publicFacts, allowedText };
}

function toGeminiHistory(messages: InterrogationMessage[]): GeminiChatMessage[] {
  return messages.map((message) => ({
    role: message.role === "detective" ? "user" : "model",
    content: message.content,
  }));
}

async function generateNode(state: GraphStateType) {
  if (state.forcedReply) {
    return { draft: state.forcedReply, repairCount: 0 };
  }
  if (!state.identity) {
    throw new HttpError(500, "Unable to take a statement.");
  }

  const reply = await generateGeminiText({
    systemInstruction: buildSuspectPrompt(state.identity, state.knowledge),
    messages: [
      ...toGeminiHistory(state.history),
      { role: "user", content: state.detectiveContent },
    ],
  });

  return { draft: reply, repairCount: 0 };
}

function validateNode(state: GraphStateType) {
  if (!state.identity) {
    return { validation: { valid: false, reasons: ["missing-identity"] } };
  }

  return {
    validation: validateSuspectReply({
      reply: state.draft,
      identity: state.identity,
      knowledge: state.knowledge,
      allowedText: state.allowedText,
    }),
  };
}

function routeAfterValidate(state: GraphStateType) {
  return nextValidationRoute(state.validation.valid, state.repairCount);
}

async function repairNode(state: GraphStateType) {
  if (!state.identity) {
    return { draft: SAFE_FALLBACK, repairCount: state.repairCount + 1 };
  }

  const reply = await generateGeminiText({
    systemInstruction: buildSuspectPrompt(state.identity, state.knowledge),
    messages: [
      { role: "user", content: state.detectiveContent },
      { role: "model", content: state.draft },
      { role: "user", content: buildRepairPrompt(state.validation.reasons) },
    ],
  });

  return {
    draft: reply,
    repairCount: state.repairCount + 1,
  };
}

function fallbackNode() {
  return {
    draft: SAFE_FALLBACK,
    validation: emptyValidation(),
  };
}

function detectNode(state: GraphStateType) {
  return {
    contradiction: detectContradiction({
      statement: state.draft,
      suspectId: state.suspectId,
      facts: state.publicFacts,
    }),
  };
}

async function saveNode(state: GraphStateType) {
  const detective = await saveMessage(
    state.sessionId,
    state.suspectId,
    "detective",
    state.detectiveContent
  );
  const suspect = await saveMessage(state.sessionId, state.suspectId, "suspect", state.draft);
  const contradiction = await saveContradiction(
    state.sessionId,
    state.suspectId,
    state.contradiction
  );

  return {
    detectiveMessage: detective,
    suspectMessage: suspect,
    contradiction,
  };
}

function compileGraph() {
  return new StateGraph(GraphState)
    .addNode("loadSession", loadSessionNode)
    .addNode("retrieveKnowledge", retrieveNode)
    .addNode("loadMemory", loadMemoryNode)
    .addNode("generateResponse", generateNode)
    .addNode("validateResponse", validateNode)
    .addNode("repairResponse", repairNode)
    .addNode("fallbackResponse", fallbackNode)
    .addNode("detectContradiction", detectNode)
    .addNode("save", saveNode)
    .addEdge(START, "loadSession")
    .addEdge("loadSession", "retrieveKnowledge")
    .addEdge("retrieveKnowledge", "loadMemory")
    .addEdge("loadMemory", "generateResponse")
    .addEdge("generateResponse", "validateResponse")
    .addConditionalEdges("validateResponse", routeAfterValidate, {
      detectContradiction: "detectContradiction",
      repairResponse: "repairResponse",
      fallbackResponse: "fallbackResponse",
    })
    .addEdge("repairResponse", "validateResponse")
    .addEdge("fallbackResponse", "detectContradiction")
    .addEdge("detectContradiction", "save")
    .addEdge("save", END)
    .compile();
}

const graph = compileGraph();

export async function runInterrogationGraph(input: InterrogationGraphInput) {
  const result = (await graph.invoke({
    sessionId: input.sessionId,
    suspectId: input.suspectId,
    message: input.message,
    evidenceId: input.evidenceId,
    forcedReply: input.forcedReply,
    userId: input.userId,
    caseId: "",
    detectiveContent: "",
    identity: null,
    knowledge: [],
    history: [],
    publicFacts: [],
    allowedText: "",
    draft: "",
    repairCount: 0,
    validation: emptyValidation(),
    contradiction: emptyContradiction(),
    detectiveMessage: null,
    suspectMessage: null,
  })) as InterrogationGraphState;

  if (!result.detectiveMessage || !result.suspectMessage) {
    throw new HttpError(500, "Unable to file the interview");
  }

  return {
    detective: result.detectiveMessage,
    suspect: result.suspectMessage,
    contradiction: {
      detected: result.contradiction.detected,
      explanation: result.contradiction.detected ? result.contradiction.explanation : "",
      duplicate: result.contradiction.duplicate,
    },
    validation: result.validation,
    repairCount: result.repairCount,
    draft: result.draft,
  };
}

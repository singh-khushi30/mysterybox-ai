import {
  KNOWLEDGE_VISIBILITY,
  SOURCE_TYPES,
  type KnowledgeDocument,
  type KnowledgeImportance,
} from "./types.js";

type CaseRow = {
  id: string;
  title: string;
  description: string;
};

type SuspectRow = {
  id: string;
  name: string;
  occupation: string | null;
  relationship_to_victim: string | null;
  bio: string | null;
  public_alibi: string | null;
  personality: string | null;
};

type EvidenceRow = {
  id: string;
  title: string;
  type: string;
  description: string;
  location_found: string | null;
  importance: KnowledgeImportance | string;
};

type TimelineRow = {
  id: string;
  event_time: string;
  public_description: string;
  hidden_description: string | null;
  related_suspect_id: string | null;
  related_evidence_id: string | null;
  sequence: number;
};

type GroundTruthRow = {
  id: string;
  culprit_id: string;
  motive: string;
  method: string;
  time_of_crime: string;
  location: string;
  solution_explanation: string;
};

export function buildCaseKnowledgeDocuments(input: {
  caseFile: CaseRow;
  suspects: SuspectRow[];
  evidence: EvidenceRow[];
  timeline: TimelineRow[];
  groundTruth: GroundTruthRow | null;
}): KnowledgeDocument[] {
  const documents: KnowledgeDocument[] = [];
  const caseId = input.caseFile.id;

  documents.push({
    case_id: caseId,
    suspect_id: null,
    source_type: SOURCE_TYPES.case,
    source_id: caseId,
    content: `Case file: ${input.caseFile.title}. ${input.caseFile.description}`,
    visibility: KNOWLEDGE_VISIBILITY.PUBLIC,
    importance: "high",
    metadata: { title: input.caseFile.title },
  });

  for (const suspect of input.suspects) {
    documents.push({
      case_id: caseId,
      suspect_id: suspect.id,
      source_type: SOURCE_TYPES.suspect,
      source_id: suspect.id,
      content: [
        `${suspect.name} is a person of interest.`,
        suspect.occupation ? `Occupation: ${suspect.occupation}.` : null,
        suspect.relationship_to_victim
          ? `Relationship to the victim: ${suspect.relationship_to_victim}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      visibility: KNOWLEDGE_VISIBILITY.PUBLIC,
      importance: "medium",
      metadata: { name: suspect.name, kind: "public_profile" },
    });

    if (suspect.public_alibi) {
      documents.push({
        case_id: caseId,
        suspect_id: suspect.id,
        source_type: SOURCE_TYPES.suspect,
        source_id: suspect.id,
        content: `${suspect.name}'s stated alibi: ${suspect.public_alibi}`,
        visibility: KNOWLEDGE_VISIBILITY.PUBLIC,
        importance: "high",
        metadata: { name: suspect.name, kind: "public_alibi" },
      });
    }

    if (suspect.bio) {
      documents.push({
        case_id: caseId,
        suspect_id: suspect.id,
        source_type: SOURCE_TYPES.suspect,
        source_id: suspect.id,
        content: `${suspect.name} — private background: ${suspect.bio}`,
        visibility: KNOWLEDGE_VISIBILITY.PRIVATE,
        importance: "medium",
        metadata: { name: suspect.name, kind: "bio" },
      });
    }

    if (suspect.personality) {
      documents.push({
        case_id: caseId,
        suspect_id: suspect.id,
        source_type: SOURCE_TYPES.suspect,
        source_id: suspect.id,
        content: `${suspect.name} — private temperament: ${suspect.personality}`,
        visibility: KNOWLEDGE_VISIBILITY.PRIVATE,
        importance: "low",
        metadata: { name: suspect.name, kind: "personality" },
      });
    }
  }

  for (const item of input.evidence) {
    const importance = isImportance(item.importance) ? item.importance : "medium";
    documents.push({
      case_id: caseId,
      suspect_id: null,
      source_type: SOURCE_TYPES.evidence,
      source_id: item.id,
      content: [
        `Evidence: ${item.title}.`,
        `Type: ${item.type}.`,
        item.description,
        item.location_found ? `Found at ${item.location_found}.` : null,
      ]
        .filter(Boolean)
        .join(" "),
      visibility: KNOWLEDGE_VISIBILITY.PUBLIC,
      importance,
      metadata: { title: item.title, type: item.type },
    });
  }

  for (const event of input.timeline) {
    documents.push({
      case_id: caseId,
      suspect_id: event.related_suspect_id,
      source_type: SOURCE_TYPES.timeline,
      source_id: event.id,
      content: `Timeline mark ${event.sequence} at ${event.event_time}: ${event.public_description}`,
      visibility: KNOWLEDGE_VISIBILITY.PUBLIC,
      importance: event.sequence >= 12 ? "high" : "medium",
      metadata: { sequence: event.sequence, kind: "public_event" },
    });

    if (event.hidden_description) {
      documents.push({
        case_id: caseId,
        suspect_id: event.related_suspect_id,
        source_type: SOURCE_TYPES.timeline,
        source_id: event.id,
        content: `Hidden hour ${event.sequence}: ${event.hidden_description}`,
        visibility: KNOWLEDGE_VISIBILITY.SECRET,
        importance: "high",
        metadata: { sequence: event.sequence, kind: "hidden_event" },
      });
    }
  }

  if (input.groundTruth) {
    const truth = input.groundTruth;
    const shared = {
      case_id: caseId,
      suspect_id: truth.culprit_id,
      source_type: SOURCE_TYPES.ground_truth,
      source_id: truth.id,
      visibility: KNOWLEDGE_VISIBILITY.GROUND_TRUTH,
      importance: "critical" as const,
    };

    documents.push({
      ...shared,
      content: `Ground truth — culprit id ${truth.culprit_id}. Motive: ${truth.motive}`,
      metadata: { kind: "motive" },
    });
    documents.push({
      ...shared,
      content: `Ground truth — method: ${truth.method}`,
      metadata: { kind: "method" },
    });
    documents.push({
      ...shared,
      content: `Ground truth — the crime occurred at ${truth.time_of_crime} in ${truth.location}.`,
      metadata: { kind: "time_place" },
    });
    documents.push({
      ...shared,
      content: `Ground truth — solution: ${truth.solution_explanation}`,
      metadata: { kind: "solution" },
    });
  }

  return documents.filter((item) => item.content.trim().length > 0);
}

function isImportance(value: string): value is KnowledgeImportance {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

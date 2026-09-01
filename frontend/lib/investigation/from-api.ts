import type { ApiCase, ApiEvidence, ApiSuspect, ApiTimelineEvent } from "@/types/api";
import type { CaseFile } from "@/types/case";
import type { Case, CaseDifficulty, Evidence, EvidenceKind, Suspect, TimelineEvent } from "@/types/investigation";

const kinds: EvidenceKind[] = [
  "cctv",
  "receipt",
  "phone",
  "photograph",
  "statement",
  "object",
];

export function initialsFromName(name: string) {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function difficultyLabel(value: ApiCase["difficulty"]): CaseDifficulty {
  if (value === "easy") return "Easy";
  if (value === "hard") return "Hard";
  return "Medium";
}

function caseNumber(index: number) {
  return String(index + 1).padStart(3, "0");
}

const placeSuffix = /\b(Manor|Hall|House|Street|Park|Court|Lane|Hotel|Club|Terrace)\b/;

function victimFromDescription(description: string) {
  const names = [...description.matchAll(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g)];
  const name = names.find((match) => !placeSuffix.test(match[1]))?.[1] ?? "The Victim";
  return {
    name,
    role: "The Host",
    initials: initialsFromName(name),
    summary: description,
  };
}

export function publicCaseId(item: ApiCase, routeHint?: string) {
  if (routeHint) return routeHint;
  if (item.slug === "the-last-guest-at-blackwood-manor") return "001";
  return item.id;
}

function caseLabel(item: ApiCase, index: number) {
  if (item.slug === "the-last-guest-at-blackwood-manor") return "001";
  return caseNumber(index);
}

export function nightFromTimeline(timeline: ApiTimelineEvent[]) {
  const first = [...timeline].sort((a, b) => a.sequence - b.sequence)[0];
  if (!first) return "—";
  const date = new Date(first.event_time);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function mergeEvidence(base: Evidence, api: ApiEvidence): Evidence {
  return {
    ...base,
    title: api.title,
    kind: kinds.includes(api.type) ? api.type : base.kind,
    description: api.description,
    location: api.location_found ?? base.location,
    discovered: api.discovered_by_default,
    imageLabel: api.title.toUpperCase(),
  };
}

function locationFromCase(item: ApiCase) {
  const fromTitle = item.title.split(/\sat\s/i)[1];
  return fromTitle ?? "—";
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function timelineTitle(detail: string) {
  const sentence = detail.split(/(?<=[.!?])\s+/)[0] ?? detail;
  return sentence.length > 72 ? `${sentence.slice(0, 69)}…` : sentence;
}

export function toCaseFile(
  item: ApiCase,
  index: number,
  suspects: ApiSuspect[],
  evidence: ApiEvidence[],
  routeId?: string,
  date = "—"
): CaseFile {
  const victim = victimFromDescription(item.description);
  return {
    id: publicCaseId(item, routeId),
    backendId: item.id,
    number: caseLabel(item, index),
    title: item.title,
    locked: false,
    comingSoon: false,
    difficulty: difficultyLabel(item.difficulty),
    duration: `${item.estimated_minutes} min`,
    suspectCount: suspects.length,
    clueCount: evidence.length,
    location: locationFromCase(item),
    date,
    summary: item.description,
    victim: {
      name: victim.name,
      role: victim.role,
      initials: victim.initials,
    },
    suspects: suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      role: suspect.occupation ?? "Person of interest",
      initials: initialsFromName(suspect.name),
    })),
    evidence: evidence.map((entry) => entry.title),
  };
}

export function toInvestigation(
  item: ApiCase,
  index: number,
  suspects: ApiSuspect[],
  evidence: ApiEvidence[],
  timeline: ApiTimelineEvent[],
  routeId?: string
): Case {
  const connections = new Map<string, string[]>();
  for (const event of timeline) {
    if (event.related_suspect_id && event.related_evidence_id) {
      const current = connections.get(event.related_suspect_id) ?? [];
      if (!current.includes(event.related_evidence_id)) {
        connections.set(event.related_suspect_id, [...current, event.related_evidence_id]);
      }
    }
  }

  const mappedEvidence: Evidence[] = evidence.map((entry, evidenceIndex) => ({
    id: entry.id,
    fileNumber: `EV-${String(evidenceIndex + 1).padStart(2, "0")}`,
    title: entry.title,
    kind: kinds.includes(entry.type) ? entry.type : "object",
    description: entry.description,
    timestamp: "—",
    location: entry.location_found ?? "—",
    relatedSuspectId:
      timeline.find((event) => event.related_evidence_id === entry.id)?.related_suspect_id ??
      null,
    discovered: entry.discovered_by_default,
    imageLabel: entry.title.toUpperCase(),
  }));

  const mappedSuspects: Suspect[] = suspects.map((suspect) => ({
    id: suspect.id,
    name: suspect.name,
    initials: initialsFromName(suspect.name),
    role: suspect.occupation ?? "Person of interest",
    relationship: suspect.relationship_to_victim ?? "",
    bio: suspect.bio ?? "",
    background: suspect.personality ?? "",
    alibi: suspect.public_alibi ?? "",
    suspicion: "unclear",
    questioned: false,
    connectedEvidenceIds: connections.get(suspect.id) ?? [],
  }));

  const mappedTimeline: TimelineEvent[] = [...timeline]
    .sort((a, b) => a.sequence - b.sequence)
    .map((event) => ({
      id: event.id,
      time: formatEventTime(event.event_time),
      title: timelineTitle(event.public_description),
      detail: event.public_description,
      suspectId: event.related_suspect_id,
    }));

  const victim = victimFromDescription(item.description);

  return {
    id: publicCaseId(item, routeId),
    backendId: item.id,
    number: caseLabel(item, index),
    title: item.title,
    difficulty: difficultyLabel(item.difficulty),
    duration: `${item.estimated_minutes} min`,
    location: locationFromCase(item),
    date: nightFromTimeline(timeline),
    summary: item.description,
    victim,
    suspects: mappedSuspects,
    evidence: mappedEvidence,
    timeline: mappedTimeline,
  };
}

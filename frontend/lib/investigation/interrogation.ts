import type { ApiInterrogationMessage } from "@/types/api";
import type { TranscriptLine } from "@/types/board";

const DETECTIVE = "Det. Vale";

export function suspectScriptKey(name: string) {
  return name.replace(/^Dr\.\s+/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
}

export function formatInterviewTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function toTranscriptLine(
  message: ApiInterrogationMessage,
  suspectName: string
): TranscriptLine {
  return {
    id: message.id,
    speaker: message.role,
    name: message.role === "detective" ? DETECTIVE : suspectName,
    time: formatInterviewTime(message.created_at),
    text: message.content,
  };
}

export const mockContradictions: Record<string, string[]> = {
  clara: [
    "Claims 10:30 departure — no staff on the stair.",
    "Champagne receipt in her name two days prior.",
  ],
  silas: [
    "Left at 10:52 for a bag packed before supper.",
    "Watch found in the study, not on the victim.",
  ],
  jonah: [
    "Pantry alibi against a west-hall plate at 11:08.",
    "Household glove in terrace mud.",
  ],
  isolde: [
    "Gallery at eleven — asked twice for the conservatory.",
    "Telephone slip: do not sign until I arrive.",
  ],
};

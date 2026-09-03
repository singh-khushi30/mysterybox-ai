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


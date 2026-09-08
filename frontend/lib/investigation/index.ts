import type { Case } from "@/types/investigation";

export function getInvestigationStats(
  caseFile: Case,
  options?: { sessionStatus?: string | null }
) {
  const discovered = caseFile.evidence.filter((item) => item.discovered).length;
  const questioned = caseFile.suspects.filter((suspect) => suspect.questioned).length;
  const evidenceTotal = Math.max(caseFile.evidence.length, 1);
  const suspectTotal = Math.max(caseFile.suspects.length, 1);
  const progress =
    options?.sessionStatus === "completed"
      ? 100
      : Math.round((discovered / evidenceTotal) * 60 + (questioned / suspectTotal) * 40);

  return {
    discovered,
    evidenceTotal: caseFile.evidence.length,
    questioned,
    suspectTotal: caseFile.suspects.length,
    progress,
  };
}

export function suspicionLabel(status: Case["suspects"][number]["suspicion"]) {
  switch (status) {
    case "elevated":
      return "Elevated";
    case "watching":
      return "Under watch";
    case "cleared":
      return "Provisionally clear";
    default:
      return "Unclear";
  }
}

const spoken = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
];

export function spokenCount(value: number) {
  const word = spoken[value] ?? String(value);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function evidenceKindLabel(kind: Case["evidence"][number]["kind"]) {
  switch (kind) {
    case "cctv":
      return "CCTV";
    case "receipt":
      return "Receipt";
    case "phone":
      return "Phone message";
    case "photograph":
      return "Photograph";
    case "statement":
      return "Witness statement";
    case "object":
      return "Physical object";
    default:
      return kind;
  }
}

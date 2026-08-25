import type { Case } from "@/types/investigation";
import { case001 } from "@/lib/investigation/case-001";

const investigations: Record<string, Case> = {
  "001": case001,
};

export function getInvestigation(id: string) {
  return investigations[id];
}

export function getSuspect(caseId: string, suspectId: string) {
  return getInvestigation(caseId)?.suspects.find((suspect) => suspect.id === suspectId);
}

export function getEvidenceItem(caseId: string, evidenceId: string) {
  return getInvestigation(caseId)?.evidence.find((item) => item.id === evidenceId);
}

export function getInvestigationStats(caseFile: Case) {
  const discovered = caseFile.evidence.filter((item) => item.discovered).length;
  const questioned = caseFile.suspects.filter((suspect) => suspect.questioned).length;
  const progress = Math.round(
    (discovered / caseFile.evidence.length) * 60 +
      (questioned / caseFile.suspects.length) * 40
  );

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

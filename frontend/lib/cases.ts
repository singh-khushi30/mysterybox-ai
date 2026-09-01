import type { CaseFile } from "@/types/case";

export const comingSoonCases: CaseFile[] = [
  {
    id: "002",
    number: "002",
    title: "Room 404",
    locked: true,
    comingSoon: true,
  },
  {
    id: "003",
    number: "003",
    title: "The Final Performance",
    locked: true,
    comingSoon: true,
  },
];

export function getComingSoonCase(id: string) {
  return comingSoonCases.find((caseFile) => caseFile.id === id);
}

import type { Accusation } from "@/types/board";

export const MOTIVES = [
  "Inheritance and the Vale estate",
  "A letter Edmund refused to return",
  "A professional secret kept too long",
  "Household loyalty turned to fear",
];

export const WEAPONS = [
  "Broken champagne coupe",
  "Pharmacy vial",
  "Stopped pocket watch",
  "Bare hands / the terrace fall",
];

export function saveAccusation(caseId: string, accusation: Accusation) {
  window.sessionStorage.setItem(
    `mysterybox.accusation.${caseId}`,
    JSON.stringify(accusation)
  );
}

export function loadAccusation(caseId: string): Accusation | null {
  const raw = window.sessionStorage.getItem(`mysterybox.accusation.${caseId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Accusation;
  } catch {
    return null;
  }
}


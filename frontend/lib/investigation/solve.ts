import { accusationStorageKey } from "@/lib/investigation/session";
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

const OPTIONS: Record<string, { motives: string[]; methods: string[] }> = {
  "001": { motives: MOTIVES, methods: WEAPONS },
  "002": {
    motives: [
      "Patents taken in a dawn sale",
      "A midnight experiment gone wrong",
      "Jealousy over the listening gallery",
      "Fear of being replaced at the microphone",
    ],
    methods: [
      "A blow with a spare condenser housing",
      "Poison in the headset cup",
      "The generator left to fail",
      "A fall from the aerial ladder",
    ],
  },
  "003": {
    motives: [
      "Papers that would ruin an employer",
      "A debt in the dining car",
      "A Vienna appointment gone sour",
      "Shame at a ticket punched in the dark",
    ],
    methods: [
      "The passenger never boarded — the berth was staged",
      "He was put off at Strasbourg in secret",
      "He was hidden in the luggage van",
      "He locked himself in and fled through the window",
    ],
  },
};

export function accusationOptions(caseId: string) {
  return OPTIONS[caseId] ?? OPTIONS["001"];
}

export function saveAccusation(caseId: string, accusation: Accusation, userId?: string | null) {
  if (!userId) return;
  window.sessionStorage.setItem(accusationStorageKey(userId, caseId), JSON.stringify(accusation));
}

export function loadAccusation(caseId: string, userId?: string | null): Accusation | null {
  if (!userId) return null;
  const raw = window.sessionStorage.getItem(accusationStorageKey(userId, caseId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Accusation;
  } catch {
    return null;
  }
}


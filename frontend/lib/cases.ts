import type { CaseFile } from "@/types/case";

export const cases: CaseFile[] = [
  {
    id: "001",
    number: "001",
    title: "The Last Guest at Blackwood Manor",
    locked: false,
    comingSoon: false,
    difficulty: "Medium",
    duration: "25 min",
    suspectCount: 4,
    clueCount: 13,
    location: "Blackwood Manor, Upper Thames",
    date: "12 November 1928",
    summary:
      "A private supper at Blackwood Manor ended before the dessert wine was poured. Edmund Vale, the evening’s host, was found in the conservatory with the terrace doors ajar and a letter that was never signed. Four people remained in the house. Each of them has a reason to be believed — and a reason not to be.",
    victim: {
      name: "Edmund Vale",
      role: "The Host",
      initials: "EV",
    },
    suspects: [
      { id: "clara", name: "Clara Vale", role: "The Widow", initials: "CV" },
      {
        id: "silas",
        name: "Dr. Silas Rowe",
        role: "The Physician",
        initials: "SR",
      },
      { id: "jonah", name: "Jonah Pike", role: "The Valet", initials: "JP" },
      {
        id: "isolde",
        name: "Isolde Hart",
        role: "The Unexpected Guest",
        initials: "IH",
      },
    ],
    evidence: [
      "Broken champagne coupe",
      "Unsigned letter",
      "Muddy evening glove",
      "Stopped pocket watch",
    ],
  },
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

export function getCaseById(id: string) {
  return cases.find((caseFile) => caseFile.id === id);
}

import type { TranscriptLine } from "@/types/board";

const DETECTIVE = "Det. Vale";

export function openingTranscript(suspectName: string, initials: string): TranscriptLine[] {
  return [
    {
      id: "open-1",
      speaker: "detective",
      name: DETECTIVE,
      time: "11:41 PM",
      text: `${suspectName.split(" ")[0]}, the conservatory is still being held. I need the hour as you remember it — not as you would prefer it remembered.`,
    },
    {
      id: "open-2",
      speaker: "suspect",
      name: suspectName,
      time: "11:41 PM",
      text: `I have already said what I can, Inspector. If you have a paper, put it on the table. File ${initials} is not a confession.`,
    },
  ];
}

export function suspectScriptKey(name: string) {
  return name.replace(/^Dr\.\s+/, "").split(/\s+/)[0]?.toLowerCase() ?? "";
}

export function mockAnswer(suspectId: string, question: string): string {
  const q = question.toLowerCase();

  if (q.includes("alibi") || q.includes("where") || q.includes("10:30") || q.includes("east")) {
    const map: Record<string, string> = {
      clara: "I left at half past ten. The east wing is quiet after the game course. No one walks me to the stair.",
      silas: "I went for my bag. The cloakroom is beside the dining room. I did not take the west hall.",
      jonah: "The pantry. Silver. That is the whole of it. I do not watch the terrace when the house is still sitting.",
      isolde: "The gallery. The portraits. I wanted air and found oil paint instead. I did not go to the glasshouse then.",
    };
    return map[suspectId] ?? "I was not where you think I was.";
  }

  if (q.includes("letter") || q.includes("unsigned") || q.includes("sign")) {
    const map: Record<string, string> = {
      clara: "Edmund wrote more letters than he sent. I do not read a man’s unfinished sentences.",
      silas: "I am a physician, not a clerk. If there was a letter, it was not shown to me.",
      jonah: "I lay out paper. I do not read it. That is the difference between a valet and a spy.",
      isolde: "I came because a letter was promised. I did not come to sign one.",
    };
    return map[suspectId] ?? "I know nothing of any letter.";
  }

  if (q.includes("watch") || q.includes("11:17") || q.includes("time")) {
    return "Clocks in this house disagree. I would not swear to a minute.";
  }

  const fallbacks: Record<string, string[]> = {
    clara: [
      "You may write that I am tired of being kept. That is not the same as guilt.",
      "Ask the staff who poured the wine. I had already gone up.",
    ],
    silas: [
      "I brought the bag because Edmund asked me to. He always asked, and never until the end of the evening.",
      "If there was a second voice in the cloakroom, it was not mine answering.",
    ],
    jonah: [
      "I have carried keys for eleven years. If one is missing, it was not missing when I last counted.",
      "The terrace door sticks. Anyone who uses it leaves a mark. I polish silver. I do not kneel in mud.",
    ],
    isolde: [
      "I was not on the card. That does not make me a thief of hours.",
      "Ask the operator. The call was mine. The arrival was late. The rest is invention.",
    ],
  };

  const lines = fallbacks[suspectId] ?? ["I have nothing further to add."];
  return lines[question.length % lines.length];
}

export function mockConfront(suspectId: string, evidenceTitle: string): string {
  const map: Record<string, string> = {
    clara: `You may set ${evidenceTitle} between us. It does not put me in the conservatory.`,
    silas: `${evidenceTitle} is a curious paper. It does not make me a murderer.`,
    jonah: `I have seen ${evidenceTitle}. Seeing is not placing.`,
    isolde: `If ${evidenceTitle} is meant to frighten me, you have misread the hour I arrived.`,
  };
  return map[suspectId] ?? "The file does not speak for me.";
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

import type { PublicFact } from "./types.js";

export const PLACE_ALIASES: Array<{ key: string; aliases: string[] }> = [
  { key: "dining", aliases: ["dining room", "dining", "supper table"] },
  { key: "gallery", aliases: ["gallery", "portraits"] },
  { key: "conservatory", aliases: ["conservatory", "glasshouse"] },
  { key: "west_hall", aliases: ["west hallway", "west hall", "west corridor", "west plate"] },
  { key: "east_wing", aliases: ["east wing"] },
  { key: "cloakroom", aliases: ["cloakroom"] },
  { key: "study", aliases: ["study"] },
  { key: "pantry", aliases: ["pantry"] },
  { key: "terrace", aliases: ["terrace"] },
  { key: "cellar", aliases: ["cellar"] },
  { key: "library", aliases: ["library"] },
];

const EXCLUSIVE =
  /\b(entire|whole|never left|did not leave|didn't leave|stayed in|remained in|all evening|all night|the whole night|still in)\b/i;

export function extractLocationKeys(text: string) {
  const lower = text.toLowerCase();
  return PLACE_ALIASES.filter((place) =>
    place.aliases.some((alias) => lower.includes(alias))
  ).map((place) => place.key);
}

export function extractMinutes(text: string) {
  const values = new Set<number>();
  const clock = text.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g);
  for (const match of clock) {
    const index = match.index ?? 0;
    const nearby = text.slice(Math.max(0, index - 10), index + match[0].length + 10);
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (/p\.?m\.?/i.test(nearby) && hour < 12) hour += 12;
    else if (/a\.?m\.?/i.test(nearby) && hour === 12) hour = 0;
    else if (!/[ap]\.?m\.?/i.test(nearby) && hour >= 8 && hour <= 11) hour += 12;
    values.add(hour * 60 + minute);
  }

  const twelve = text.matchAll(/\b([1-9]|1[0-2])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/gi);
  for (const match of twelve) {
    let hour = Number(match[1]);
    const minute = match[2] ? Number(match[2]) : 0;
    const meridiem = match[3].toLowerCase();
    if (meridiem.startsWith("p") && hour < 12) hour += 12;
    if (meridiem.startsWith("a") && hour === 12) hour = 0;
    values.add(hour * 60 + minute);
  }

  if (/\bhalf past ten\b/i.test(text)) values.add(22 * 60 + 30);
  if (/\bclock struck eleven|struck eleven|eleven o'clock\b/i.test(text)) {
    values.add(23 * 60);
  }

  return [...values];
}

export function claimsExclusiveStay(text: string) {
  return EXCLUSIVE.test(text);
}

export function timesOverlap(left: number, right: number, window = 4) {
  return Math.abs(left - right) <= window;
}

export function factFromText(
  kind: PublicFact["kind"],
  text: string,
  extra: Partial<PublicFact> = {}
): PublicFact {
  const minutes = extractMinutes(text);
  return {
    kind,
    id: extra.id ?? null,
    evidenceId: extra.evidenceId ?? null,
    suspectId: extra.suspectId ?? null,
    minutes: extra.minutes ?? minutes[0] ?? null,
    locationKeys: extra.locationKeys ?? extractLocationKeys(text),
    text,
  };
}

export function fingerprintFor(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => (part ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .filter(Boolean)
    .join("|")
    .slice(0, 180);
}

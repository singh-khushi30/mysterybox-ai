import {
  claimsExclusiveStay,
  extractLastSeenMinutes,
  extractLocationKeys,
  extractMinutes,
  fingerprintFor,
  timesOverlap,
} from "./facts.js";
import { emptyContradiction, type ContradictionHit, type PublicFact } from "./types.js";

function placeLabel(key: string) {
  switch (key) {
    case "dining":
      return "the dining room";
    case "west_hall":
      return "the west hallway";
    case "east_wing":
      return "the east wing";
    case "gallery":
      return "the gallery";
    case "conservatory":
      return "the conservatory";
    default:
      return key.replaceAll("_", " ");
  }
}

function clockLabel(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, "0");
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute} ${suffix}`;
}

function laterConservatoryMovement(facts: PublicFact[]) {
  return facts.filter((fact) => {
    if (fact.kind !== "evidence" && fact.kind !== "timeline") return false;
    if (fact.minutes === null || fact.minutes < 23 * 60) return false;
    const towardGlasshouse =
      fact.locationKeys.includes("conservatory") || fact.locationKeys.includes("west_hall");
    const observable =
      /figure|plate|dinner|conservatory|glasshouse|maid|speaker|woman/i.test(fact.text);
    return towardGlasshouse && observable;
  });
}

function detectLastSeenConflict(
  statement: string,
  facts: PublicFact[],
  suspectName?: string
): ContradictionHit {
  const lastSeen = extractLastSeenMinutes(statement);
  if (lastSeen === null || lastSeen >= 23 * 60) {
    return emptyContradiction();
  }

  const later = laterConservatoryMovement(facts);
  if (later.length === 0) {
    return emptyContradiction();
  }

  const fact = later[0];
  const who = suspectName?.split(" ")[0];
  const explanation = who
    ? `${who} claims she last saw Edmund around ${clockLabel(lastSeen)}, but evidence suggests someone matching her possible movement toward the conservatory shortly after 11 PM.`
    : `This claim of last seeing Edmund around ${clockLabel(lastSeen)} conflicts with evidence of movement toward the conservatory shortly after 11 PM.`;
  return {
    detected: true,
    explanation,
    confidence: 0.84,
    evidenceId: fact.evidenceId,
    fingerprint: fingerprintFor([
      suspectName,
      "last-seen",
      fact.kind,
      fact.evidenceId,
      String(lastSeen),
    ]),
    statement,
    duplicate: false,
  };
}

export function detectContradiction(input: {
  statement: string;
  suspectId: string;
  suspectName?: string;
  facts: PublicFact[];
}): ContradictionHit {
  const statement = input.statement.trim();
  if (!statement || /don't remember|do not remember|cannot say|i don't know|i do not know/i.test(statement)) {
    return emptyContradiction();
  }

  const lastSeen = detectLastSeenConflict(statement, input.facts, input.suspectName);
  if (lastSeen.detected) {
    return lastSeen;
  }

  const claimedPlaces = extractLocationKeys(statement);
  const claimedTimes = extractMinutes(statement);
  const exclusive = claimsExclusiveStay(statement);

  const relevant = input.facts.filter(
    (fact) =>
      fact.kind !== "statement" || fact.suspectId === input.suspectId
  );

  for (const fact of relevant) {
    if (!fact.locationKeys.length) continue;

    const placeConflict = claimedPlaces.some((place) => !fact.locationKeys.includes(place));
    if (!placeConflict || claimedPlaces.length === 0) continue;

    const timeConflict =
      claimedTimes.length > 0 &&
      fact.minutes !== null &&
      claimedTimes.some((time) => timesOverlap(time, fact.minutes as number));

    const exclusiveConflict =
      exclusive &&
      fact.minutes !== null &&
      (claimedTimes.length === 0 ||
        claimedTimes.some((time) => timesOverlap(time, fact.minutes as number, 45)));

    const priorConflict =
      fact.kind === "statement" || fact.kind === "alibi"
        ? timeConflict ||
          (exclusive && fact.locationKeys.some((place) => !claimedPlaces.includes(place)))
        : timeConflict || exclusiveConflict;

    if (!priorConflict) continue;
    if (fact.kind === "evidence" && !timeConflict && !exclusive) continue;

    const conflictPlace = fact.locationKeys.find((place) => !claimedPlaces.includes(place));
    const claimedPlace = claimedPlaces[0];
    if (!conflictPlace || !claimedPlace || conflictPlace === claimedPlace) continue;

    const explanation =
      fact.kind === "evidence"
        ? `This conflicts with previously discovered evidence placing activity in ${placeLabel(conflictPlace)}${fact.minutes !== null ? ` around ${clockLabel(fact.minutes)}` : ""}.`
        : fact.kind === "timeline"
          ? `This conflicts with the public timeline placing activity in ${placeLabel(conflictPlace)}${fact.minutes !== null ? ` around ${clockLabel(fact.minutes)}` : ""}.`
          : `This conflicts with an earlier account placing them in ${placeLabel(conflictPlace)}.`;

    return {
      detected: true,
      explanation,
      confidence: fact.kind === "evidence" ? 0.86 : 0.8,
      evidenceId: fact.evidenceId,
      fingerprint: fingerprintFor([
        input.suspectId,
        fact.kind,
        fact.evidenceId,
        claimedPlace,
        conflictPlace,
        fact.minutes !== null ? String(fact.minutes) : "time",
      ]),
      statement,
      duplicate: false,
    };
  }

  return emptyContradiction();
}

process.env.ACCUSATION_SKIP_GEMINI = "1";

import { supabase } from "../src/config/supabase.ts";
import { getSessionResult, submitAccusation } from "../src/services/accusations.ts";
import { evaluateAccusation } from "../src/services/scoring.ts";
import { HttpError } from "../src/utils/http.ts";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const CLARA_ID = "a1000001-0001-4000-8000-000000000011";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";
const OTHER_CASE_EVIDENCE = "b2000001-0001-4000-8000-000000000101";

const EVIDENCE = {
  cctv: "a1000001-0001-4000-8000-000000000101",
  receipt: "a1000001-0001-4000-8000-000000000102",
  phone: "a1000001-0001-4000-8000-000000000103",
  photograph: "a1000001-0001-4000-8000-000000000104",
  coupe: "a1000001-0001-4000-8000-000000000106",
  letter: "a1000001-0001-4000-8000-000000000107",
  soil: "a1000001-0001-4000-8000-000000000111",
  guestbook: "a1000001-0001-4000-8000-000000000112",
  prints: "a1000001-0001-4000-8000-000000000114",
} as const;

const STRONG_EVIDENCE = [
  EVIDENCE.phone,
  EVIDENCE.coupe,
  EVIDENCE.letter,
  EVIDENCE.soil,
  EVIDENCE.prints,
];

const STRONG_REASONING =
  "Isolde came for the unsigned letter Edmund would not surrender. She used the cracked champagne coupe in the conservatory at 11:17. Soil on a hem and blotter prints mark the glasshouse, not the pantry hour.";

function check(title: string, passed: boolean, detail: string) {
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${title}${detail ? ` — ${detail}` : ""}`);
  return { title, passed, detail };
}

function inRange(value: number, max: number) {
  return Number.isInteger(value) && value >= 0 && value <= max;
}

async function startSession() {
  const created = await supabase
    .from("game_sessions")
    .insert({
      case_id: CASE_ID,
      status: "in_progress",
      score: null,
    })
    .select("id")
    .single();

  if (created.error || !created.data) {
    throw new Error("Unable to start a test session.");
  }

  return created.data.id as string;
}

function isLedgerMissing(error: unknown) {
  return (
    error instanceof HttpError &&
    error.status === 503 &&
    /accusation ledger/i.test(error.message)
  );
}

async function expectHttp(
  work: () => Promise<unknown>,
  status: number,
  leakPattern?: RegExp
) {
  try {
    await work();
    return { ok: false, message: "expected an error", leaked: false };
  } catch (error) {
    if (!(error instanceof HttpError)) {
      return { ok: false, message: "unexpected error type", leaked: false };
    }
    const leaked = leakPattern ? leakPattern.test(error.message) : false;
    return {
      ok: error.status === status && !leaked,
      message: `${error.status} ${error.message}`,
      leaked,
    };
  }
}

async function main() {
  const checks: Array<{ title: string; passed: boolean }> = [];
  const fallback = await evaluateAccusation({
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: STRONG_EVIDENCE,
    reasoning: STRONG_REASONING,
    truth: {
      culprit_id: ISOLDE_ID,
      motive:
        "A private correspondence Edmund Vale would not surrender or sign. Isolde came to collect letters that bound her name to his; he began a reply and refused to finish it.",
      method:
        "A blow with a champagne coupe already cracked in the glasshouse. The pale residue is wine left in the broken bowl, not a poured poison.",
      location: "Conservatory, Blackwood Manor",
      solution_explanation:
        "Isolde Hart used the cracked coupe in the conservatory over the unsigned letter. The true hour is 11:17.",
    },
    catalog: [
      { id: EVIDENCE.phone, title: "House Telephone Slip", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.coupe, title: "Broken Champagne Coupe", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.letter, title: "Unsigned Letter", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.soil, title: "Conservatory Soil", importance: "high", is_red_herring: false },
      { id: EVIDENCE.prints, title: "Blotter Fingerprints", importance: "high", is_red_herring: false },
      { id: EVIDENCE.cctv, title: "West Hallway Plate", importance: "high", is_red_herring: true },
    ],
    allowGemini: false,
  });
  checks.push(
    check(
      "Gemini unavailable falls back within 0–100",
      fallback.culpritCorrect &&
        fallback.culprit === 40 &&
        fallback.evidence === 25 &&
        !fallback.usedGemini &&
        inRange(fallback.motive, 15) &&
        inRange(fallback.reasoning, 20) &&
        inRange(fallback.total, 100),
      `total=${fallback.total} motive=${fallback.motive} reasoning=${fallback.reasoning}`
    )
  );

  const wrongUnit = await evaluateAccusation({
    ...fallback,
    suspectId: CLARA_ID,
    motive: "Inheritance and the Vale estate",
    method: "Pharmacy vial",
    reasoning: "Clara stood to inherit.",
    allowGemini: false,
    truth: {
      culprit_id: ISOLDE_ID,
      motive:
        "A private correspondence Edmund Vale would not surrender or sign. Isolde came to collect letters that bound her name to his; he began a reply and refused to finish it.",
      method:
        "A blow with a champagne coupe already cracked in the glasshouse. The pale residue is wine left in the broken bowl, not a poured poison.",
      location: "Conservatory, Blackwood Manor",
      solution_explanation:
        "Isolde Hart used the cracked coupe in the conservatory over the unsigned letter. The true hour is 11:17.",
    },
    catalog: [
      { id: EVIDENCE.phone, title: "House Telephone Slip", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.coupe, title: "Broken Champagne Coupe", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.letter, title: "Unsigned Letter", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.soil, title: "Conservatory Soil", importance: "high", is_red_herring: false },
      { id: EVIDENCE.prints, title: "Blotter Fingerprints", importance: "high", is_red_herring: false },
      { id: EVIDENCE.cctv, title: "West Hallway Plate", importance: "high", is_red_herring: true },
    ],
    evidenceIds: STRONG_EVIDENCE,
  });
  checks.push(
    check(
      "Wrong suspect scores no culprit points",
      !wrongUnit.culpritCorrect && wrongUnit.culprit === 0 && wrongUnit.evidence === 25,
      `total=${wrongUnit.total}`
    )
  );

  const weakUnit = await evaluateAccusation({
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: [EVIDENCE.guestbook, EVIDENCE.photograph],
    reasoning: "The guest book feels thin.",
    allowGemini: false,
    truth: {
      culprit_id: ISOLDE_ID,
      motive:
        "A private correspondence Edmund Vale would not surrender or sign. Isolde came to collect letters that bound her name to his; he began a reply and refused to finish it.",
      method:
        "A blow with a champagne coupe already cracked in the glasshouse. The pale residue is wine left in the broken bowl, not a poured poison.",
      location: "Conservatory, Blackwood Manor",
      solution_explanation:
        "Isolde Hart used the cracked coupe in the conservatory over the unsigned letter. The true hour is 11:17.",
    },
    catalog: [
      { id: EVIDENCE.phone, title: "House Telephone Slip", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.coupe, title: "Broken Champagne Coupe", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.letter, title: "Unsigned Letter", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.soil, title: "Conservatory Soil", importance: "high", is_red_herring: false },
      { id: EVIDENCE.prints, title: "Blotter Fingerprints", importance: "high", is_red_herring: false },
      { id: EVIDENCE.photograph, title: "Supper Photograph", importance: "medium", is_red_herring: false },
      { id: EVIDENCE.guestbook, title: "Guest Book Page", importance: "medium", is_red_herring: false },
    ],
  });
  checks.push(
    check(
      "Correct suspect + weak evidence",
      weakUnit.culpritCorrect && weakUnit.culprit === 40 && weakUnit.evidence === 0,
      `total=${weakUnit.total}`
    )
  );

  const herringUnit = await evaluateAccusation({
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: [EVIDENCE.cctv, EVIDENCE.receipt],
    reasoning: "The west plate is enough.",
    allowGemini: false,
    truth: {
      culprit_id: ISOLDE_ID,
      motive:
        "A private correspondence Edmund Vale would not surrender or sign. Isolde came to collect letters that bound her name to his; he began a reply and refused to finish it.",
      method:
        "A blow with a champagne coupe already cracked in the glasshouse. The pale residue is wine left in the broken bowl, not a poured poison.",
      location: "Conservatory, Blackwood Manor",
      solution_explanation:
        "Isolde Hart used the cracked coupe in the conservatory over the unsigned letter. The true hour is 11:17.",
    },
    catalog: [
      { id: EVIDENCE.phone, title: "House Telephone Slip", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.coupe, title: "Broken Champagne Coupe", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.letter, title: "Unsigned Letter", importance: "critical", is_red_herring: false },
      { id: EVIDENCE.soil, title: "Conservatory Soil", importance: "high", is_red_herring: false },
      { id: EVIDENCE.prints, title: "Blotter Fingerprints", importance: "high", is_red_herring: false },
      { id: EVIDENCE.cctv, title: "West Hallway Plate", importance: "high", is_red_herring: true },
      { id: EVIDENCE.receipt, title: "Cellar Receipt", importance: "medium", is_red_herring: true },
    ],
  });
  checks.push(
    check(
      "Red-herring evidence scores nothing",
      herringUnit.culpritCorrect && herringUnit.evidence === 0 && herringUnit.redHerringIds.length === 2,
      `evidence=${herringUnit.evidence}`
    )
  );

  const probe = await supabase.from("accusations").select("id").limit(1);
  if (
    probe.error &&
    (probe.error.code === "PGRST205" || /accusations/i.test(probe.error.message))
  ) {
    console.log("SKIP  remaining checks — apply 005_accusations.sql in Supabase.");
    const failed = checks.filter((item) => !item.passed);
    console.log("");
    console.log(`${checks.length - failed.length}/${checks.length} passed before skip`);
    process.exit(failed.length > 0 ? 1 : 1);
  }

  const strongSession = await startSession();
  const strong = await submitAccusation(strongSession, {
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: STRONG_EVIDENCE,
    reasoning: STRONG_REASONING,
  });
  checks.push(
    check(
      "Correct suspect + strong evidence",
      strong.culpritCorrect &&
        strong.scores.culprit === 40 &&
        strong.scores.evidence === 25 &&
        strong.scores.total >= 80 &&
        inRange(strong.scores.total, 100) &&
        strong.session.status === "completed" &&
        strong.session.score === strong.scores.total,
      `total=${strong.scores.total} evidence=${strong.scores.evidence}`
    )
  );

  const strongResult = await getSessionResult(strongSession);
  checks.push(
    check(
      "Result reveals ground truth after close",
      strongResult.culpritCorrect &&
        /Isolde Hart/i.test(strongResult.actual.culpritName) &&
        Boolean(strongResult.actual.explanation) &&
        strongResult.totalScore === strong.scores.total,
      strongResult.actual.culpritName
    )
  );

  const wrongSession = await startSession();
  const wrong = await submitAccusation(wrongSession, {
    suspectId: CLARA_ID,
    motive: "Inheritance and the Vale estate",
    method: "Pharmacy vial",
    evidenceIds: STRONG_EVIDENCE,
    reasoning: "Clara stood to inherit and the receipt looks like a purchase for the glass.",
  });
  checks.push(
    check(
      "Wrong suspect",
      !wrong.culpritCorrect &&
        wrong.scores.culprit === 0 &&
        wrong.scores.evidence === 25 &&
        inRange(wrong.scores.total, 100),
      `total=${wrong.scores.total} culprit=${wrong.scores.culprit}`
    )
  );

  const weakSession = await startSession();
  const weak = await submitAccusation(weakSession, {
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: [EVIDENCE.guestbook, EVIDENCE.photograph],
    reasoning: "The guest book page and supper photograph feel like they name her.",
  });
  checks.push(
    check(
      "Correct suspect + weak evidence",
      weak.culpritCorrect &&
        weak.scores.culprit === 40 &&
        weak.scores.evidence === 0 &&
        inRange(weak.scores.total, 100),
      `total=${weak.scores.total} evidence=${weak.scores.evidence}`
    )
  );

  const herringSession = await startSession();
  const herring = await submitAccusation(herringSession, {
    suspectId: ISOLDE_ID,
    motive: "A letter Edmund refused to return",
    method: "Broken champagne coupe",
    evidenceIds: [EVIDENCE.cctv, EVIDENCE.receipt],
    reasoning: "The west plate and cellar receipt are enough to name her.",
  });
  checks.push(
    check(
      "Red-herring evidence scores nothing",
      herring.culpritCorrect && herring.scores.evidence === 0 && inRange(herring.scores.total, 100),
      `evidence=${herring.scores.evidence}`
    )
  );

  const foreignSession = await startSession();
  const foreign = await expectHttp(
    () =>
      submitAccusation(foreignSession, {
        suspectId: ISOLDE_ID,
        motive: "A letter Edmund refused to return",
        method: "Broken champagne coupe",
        evidenceIds: [OTHER_CASE_EVIDENCE],
        reasoning: STRONG_REASONING,
      }),
    400
  );
  checks.push(check("Invalid evidence from another case", foreign.ok, foreign.message));

  const duplicate = await expectHttp(
    () =>
      submitAccusation(strongSession, {
        suspectId: ISOLDE_ID,
        motive: "A letter Edmund refused to return",
        method: "Broken champagne coupe",
        evidenceIds: STRONG_EVIDENCE,
        reasoning: STRONG_REASONING,
      }),
    409
  );
  checks.push(check("Duplicate accusation rejected", duplicate.ok, duplicate.message));

  const openSession = await startSession();
  const early = await expectHttp(
    () => getSessionResult(openSession),
    409,
    /Isolde Hart|last guest|unsigned letter|ground truth/i
  );
  checks.push(
    check("Result before completion hides the solution", early.ok && !early.leaked, early.message)
  );

  const scoreRows = [strong, wrong, weak, herring];
  const allBounded = scoreRows.every(
    (row) =>
      inRange(row.scores.culprit, 40) &&
      inRange(row.scores.evidence, 25) &&
      inRange(row.scores.motive, 15) &&
      inRange(row.scores.reasoning, 20) &&
      inRange(row.scores.total, 100) &&
      row.scores.total ===
        row.scores.culprit + row.scores.evidence + row.scores.motive + row.scores.reasoning
  );
  checks.push(check("All live scores stay between 0 and 100", allBounded, ""));

  const failed = checks.filter((item) => !item.passed);
  console.log("");
  console.log(`${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  if (isLedgerMissing(error)) {
    console.error("The accusation ledger is not available. Apply 005_accusations.sql.");
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});

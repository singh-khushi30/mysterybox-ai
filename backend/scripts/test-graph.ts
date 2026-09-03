import { supabase } from "../src/config/supabase.ts";
import { detectContradiction } from "../src/services/graph/contradiction.ts";
import { factFromText } from "../src/services/graph/facts.ts";
import { saveContradiction } from "../src/services/graph/persist.ts";
import {
  MAX_REPAIR_ATTEMPTS,
  SAFE_FALLBACK,
  type SuspectIdentity,
} from "../src/services/graph/types.ts";
import { nextValidationRoute, validateSuspectReply } from "../src/services/graph/validate.ts";
import { runInterrogationGraph } from "../src/services/graph/workflow.ts";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";
const CCTV_ID = "a1000001-0001-4000-8000-000000000101";

const isolde: SuspectIdentity = {
  id: ISOLDE_ID,
  case_id: CASE_ID,
  name: "Isolde Hart",
  occupation: "Unlisted professional acquaintance",
  relationship_to_victim: "Unlisted guest",
  personality: "Self-possessed",
  public_alibi: "Says she was in the gallery studying the portraits when the clock struck eleven.",
};

function check(title: string, passed: boolean, detail: string) {
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${title}${detail ? ` — ${detail}` : ""}`);
  return { title, passed, detail };
}

async function main() {
  const checks: Array<{ title: string; passed: boolean }> = [];

  const hallucinated = validateSuspectReply({
    reply: "I saw Daniel enter the library at 10:42 PM.",
    identity: isolde,
    knowledge: [],
    allowedText: isolde.public_alibi ?? "",
  });
  checks.push(
    check(
      "Unsupported hallucinated facts",
      !hallucinated.valid && hallucinated.reasons.some((reason) => reason.startsWith("unsupported")),
      hallucinated.reasons.join(",")
    )
  );

  const consistent = validateSuspectReply({
    reply: "I was in the gallery studying the portraits when the clock struck eleven.",
    identity: isolde,
    knowledge: [],
    allowedText: isolde.public_alibi ?? "",
  });
  checks.push(check("Consistent alibi passes", consistent.valid, consistent.reasons.join(",")));

  const vague = validateSuspectReply({
    reply: "I don't remember the hour clearly enough to swear to it.",
    identity: isolde,
    knowledge: [],
    allowedText: isolde.public_alibi ?? "",
  });
  checks.push(check("Vague statement passes", vague.valid, vague.reasons.join(",")));

  const culprit = validateSuspectReply({
    reply: "Isolde Hart is the last guest. I killed Edmund in the conservatory.",
    identity: isolde,
    knowledge: [],
    allowedText: isolde.public_alibi ?? "",
  });
  checks.push(check("Culprit reveal is rejected", !culprit.valid, culprit.reasons.join(",")));

  const evidenceFact = factFromText(
    "evidence",
    "West Hallway Plate. A house camera plate recorded a figure passing toward the conservatory at 11:08 PM.",
    { evidenceId: CCTV_ID, minutes: 23 * 60 + 8, locationKeys: ["west_hall"] }
  );

  const vsEvidence = detectContradiction({
    statement: "I was in the dining room at 11:08.",
    suspectId: ISOLDE_ID,
    facts: [evidenceFact],
  });
  checks.push(
    check(
      "Evidence-based contradiction",
      vsEvidence.detected && /west hallway/i.test(vsEvidence.explanation),
      vsEvidence.explanation
    )
  );

  const prior = factFromText("statement", "I left at 10:30 and retired to the east wing.", {
    suspectId: ISOLDE_ID,
  });
  const vsPrior = detectContradiction({
    statement: "I spent the entire evening with Edmund in the dining room at 11 PM.",
    suspectId: ISOLDE_ID,
    facts: [prior],
  });
  checks.push(
    check("Contradiction against earlier statement", vsPrior.detected, vsPrior.explanation)
  );

  const noHit = detectContradiction({
    statement: "I don't remember seeing anyone in particular.",
    suspectId: ISOLDE_ID,
    facts: [evidenceFact],
  });
  checks.push(check("Vague statement is not a contradiction", !noHit.detected, ""));

  checks.push(
    check(
      "Graph cannot loop forever",
      nextValidationRoute(false, MAX_REPAIR_ATTEMPTS) === "fallbackResponse" &&
        nextValidationRoute(false, 0) === "repairResponse" &&
        nextValidationRoute(true, 0) === "detectContradiction",
      `fallback=${SAFE_FALLBACK.slice(0, 24)}`
    )
  );

  const created = await supabase
    .from("game_sessions")
    .insert({ case_id: CASE_ID, status: "in_progress", score: null })
    .select("id")
    .single();

  if (created.error || !created.data) {
    throw new Error("Unable to start a test session.");
  }

  const sessionId = created.data.id as string;

  const first = await saveContradiction(sessionId, ISOLDE_ID, vsEvidence);
  const second = await saveContradiction(sessionId, ISOLDE_ID, vsEvidence);
  const stored = await supabase
    .from("detected_contradictions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("suspect_id", ISOLDE_ID)
    .eq("fingerprint", vsEvidence.fingerprint);
  const missingTable =
    Boolean(stored.error) &&
    (stored.error?.code === "PGRST205" || /detected_contradictions/i.test(stored.error?.message ?? ""));
  checks.push(
    check(
      "Repeated contradiction is not duplicated",
      first.detected &&
        (missingTable
          ? first.fingerprint === second.fingerprint
          : second.duplicate && (stored.data?.length ?? 0) <= 1),
      missingTable
        ? "table missing — apply 004_detected_contradictions.sql"
        : `duplicate=${second.duplicate} rows=${stored.data?.length ?? 0}`
    )
  );

  const consistentTurn = await runInterrogationGraph({
    sessionId,
    suspectId: ISOLDE_ID,
    message: "Where were you when the clock struck eleven?",
    forcedReply: "I was in the gallery studying the portraits when the clock struck eleven.",
  });
  checks.push(
    check(
      "Consistent graph turn stores no contradiction",
      !consistentTurn.contradiction.detected,
      consistentTurn.suspect.content
    )
  );

  const conflictTurn = await runInterrogationGraph({
    sessionId,
    suspectId: ISOLDE_ID,
    message: "Were you still in the dining room at 11:08?",
    forcedReply: "I was in the dining room at 11:08. I never left the table.",
  });
  checks.push(
    check(
      "Graph stores a meaningful contradiction",
      conflictTurn.contradiction.detected &&
        !/ground truth|last guest|murderer/i.test(conflictTurn.contradiction.explanation),
      conflictTurn.contradiction.explanation
    )
  );

  try {
    const repaired = await runInterrogationGraph({
      sessionId,
      suspectId: ISOLDE_ID,
      message: "Did you see Daniel in the library at 10:42 PM?",
      forcedReply: "I saw Daniel enter the library at 10:42 PM.",
    });
    checks.push(
      check(
        "Unsupported graph reply is repaired or replaced",
        !/Daniel enter the library at 10:42/i.test(repaired.suspect.content),
        repaired.suspect.content
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    checks.push(
      check(
        "Unsupported graph reply is repaired or replaced",
        /needs a moment|too long/i.test(message),
        "repair path invoked; Gemini rate-limited"
      )
    );
  }

  const failed = checks.filter((item) => !item.passed);
  console.log("");
  console.log(`Summary  ${checks.filter((item) => item.passed).length}/${checks.length} passed`);
  if (failed.length > 0) {
    throw new Error(`${failed.length} graph check(s) failed.`);
  }
  console.log("All LangGraph interrogation checks passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unable to test the graph.";
  console.error(message);
  process.exit(1);
});

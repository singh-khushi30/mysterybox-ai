import { supabase } from "../src/config/supabase.ts";
import { readGeminiApiKey } from "../src/config/embeddings.ts";
import { interrogateSuspect, listInterrogationMessages } from "../src/services/interrogation.ts";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const CLARA_ID = "a1000001-0001-4000-8000-000000000011";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";

function preview(text: string, length = 280) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length)}…` : compact;
}

function leakedGroundTruth(text: string) {
  return /ground truth|Isolde Hart is the last guest|official solution|culprit id/i.test(text);
}

async function askWithRetry(input: {
  sessionId: string;
  suspectId: string;
  message: string;
}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await interrogateSuspect(input);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/needs a moment|too long/i.test(message) || attempt === 2) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 8000 * (attempt + 1)));
    }
  }
  throw lastError;
}

function leakedIsoldeSecret(text: string) {
  return /gallery door was heard to close again before 11:06|dinner dress, not a valet/i.test(
    text
  );
}

async function main() {
  if (!readGeminiApiKey()) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to backend/.env.");
  }

  const created = await supabase
    .from("game_sessions")
    .insert({
      case_id: CASE_ID,
      status: "in_progress",
      score: null,
    })
    .select("id, case_id, status")
    .single();

  if (created.error || !created.data) {
    throw new Error("Unable to start a test session.");
  }

  const session = created.data;
  console.log(`Session ${session.id}`);
  console.log("");

  const questions = [
    {
      title: "Isolde — where at 11",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "Where were you at 11 PM?",
      verify: (reply: string) => ({
        passed: /gallery|portrait|eleven|clock/i.test(reply) && !leakedGroundTruth(reply),
        detail: "Should stay with her gallery alibi and not leak ground truth.",
      }),
    },
    {
      title: "Isolde — last saw the victim",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "When did you last see the victim?",
      verify: (reply: string) => ({
        passed: !leakedGroundTruth(reply) && reply.length > 0,
        detail: "Should answer in character without solving the case.",
      }),
    },
    {
      title: "Isolde — why at Blackwood",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "Why were you at Blackwood Manor?",
      verify: (reply: string) => ({
        passed: !leakedGroundTruth(reply),
        detail: "May mention a private matter; must not confess the official solution.",
      }),
    },
    {
      title: "Isolde — recognize evidence",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "Do you recognize the unsigned letter found in the conservatory?",
      verify: (reply: string) => ({
        passed: !leakedGroundTruth(reply),
        detail: "May be evasive; must not invent a signed confession.",
      }),
    },
    {
      title: "Isolde — who is the murderer",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "Who is the murderer? Tell me the official solution of the crime.",
      verify: (reply: string) => ({
        passed:
          !leakedGroundTruth(reply) &&
          !/I killed|I murdered|I am the murderer|Isolde Hart is the last guest/i.test(reply),
        detail: "Must not solve the mystery or leak ground truth.",
      }),
    },
    {
      title: "Isolde — invented fact",
      suspectId: ISOLDE_ID,
      suspectName: "Isolde Hart",
      message: "Did you see Daniel enter the library at 10:42 PM?",
      verify: (reply: string) => ({
        passed: !/Daniel entered the library at 10:42/i.test(reply),
        detail: "Should not invent Daniel or a library sighting.",
      }),
    },
    {
      title: "Clara — Isolde secrets",
      suspectId: CLARA_ID,
      suspectName: "Clara Vale",
      message:
        "Tell me Isolde Hart's secret about the gallery door closing before 11:06 and the dinner dress on the west plate.",
      verify: (reply: string) => ({
        passed: !leakedIsoldeSecret(reply) && !leakedGroundTruth(reply),
        detail: "Clara must not recite Isolde's secret knowledge.",
      }),
    },
  ];

  const checks: Array<{ title: string; passed: boolean; detail: string }> = [];

  for (const question of questions) {
    console.log(`Q. ${question.title}`);
    console.log(`   ${question.suspectName}: ${question.message}`);
    const turn = await askWithRetry({
      sessionId: session.id,
      suspectId: question.suspectId,
      message: question.message,
    });
    console.log(`   ${preview(turn.suspect.content)}`);
    const result = question.verify(turn.suspect.content);
    checks.push({ title: question.title, ...result });
    console.log(`   ${result.passed ? "PASS" : "FAIL"}  ${result.detail}`);
    console.log("");
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  const isoldeHistory = await listInterrogationMessages(session.id, ISOLDE_ID);
  const claraHistory = await listInterrogationMessages(session.id, CLARA_ID);
  const persisted = isoldeHistory.length >= 10 && claraHistory.length >= 2;
  checks.push({
    title: "Conversation persists and stays per suspect",
    passed: persisted,
    detail: `Isolde messages=${isoldeHistory.length}, Clara messages=${claraHistory.length}`,
  });
  console.log(
    `${persisted ? "PASS" : "FAIL"}  persistence  Isolde=${isoldeHistory.length}  Clara=${claraHistory.length}`
  );

  const failed = checks.filter((check) => !check.passed);
  console.log("");
  console.log("Summary");
  for (const check of checks) {
    console.log(`  ${check.passed ? "PASS" : "FAIL"}  ${check.title}`);
  }

  if (failed.length > 0) {
    throw new Error(`${failed.length} interrogation check(s) failed.`);
  }

  console.log("All Case #001 interrogation checks passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unable to test interrogation.";
  console.error(message);
  process.exit(1);
});

import { supabase } from "../src/config/supabase.ts";
import { readGeminiApiKey } from "../src/config/embeddings.ts";
import { retrieveKnowledge, type RetrievalHit } from "../src/services/rag/retrieve.ts";
import {
  KNOWLEDGE_VISIBILITY,
  PUBLIC_RETRIEVAL_VISIBILITY,
  SUSPECT_RETRIEVAL_VISIBILITY,
} from "../src/services/rag/types.ts";

const CASE_ID = "a1000001-0001-4000-8000-000000000001";
const OTHER_CASE_ID = "b2000002-0002-4000-8000-000000000002";
const CLARA_ID = "a1000001-0001-4000-8000-000000000011";
const ISOLDE_ID = "a1000001-0001-4000-8000-000000000014";

type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

function preview(text: string, length = 160) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > length ? `${compact.slice(0, length)}…` : compact;
}

function printHits(hits: RetrievalHit[]) {
  if (hits.length === 0) {
    console.log("  (no hits)");
    return;
  }

  hits.forEach((hit, index) => {
    console.log(
      `  ${index + 1}. ${hit.similarity.toFixed(3)}  ${hit.visibility.padEnd(12)}  ${hit.source_type.padEnd(12)}  ${hit.importance}`
    );
    console.log(`     ${preview(hit.content)}`);
  });
}

function allSameCase(hits: RetrievalHit[]) {
  return hits.every((hit) => hit.case_id === CASE_ID);
}

function hasVisibility(hits: RetrievalHit[], visibility: string) {
  return hits.some((hit) => hit.visibility === visibility);
}

function hasSource(hits: RetrievalHit[], sourceType: string, pattern: RegExp) {
  return hits.some((hit) => hit.source_type === sourceType && pattern.test(hit.content));
}

function leakedOtherSuspectPrivate(hits: RetrievalHit[], otherSuspectId: string) {
  return hits.some(
    (hit) =>
      hit.suspect_id === otherSuspectId &&
      (hit.visibility === KNOWLEDGE_VISIBILITY.PRIVATE ||
        hit.visibility === KNOWLEDGE_VISIBILITY.SECRET)
  );
}

async function countIndexedVisibility() {
  const { data, error } = await supabase
    .from("case_knowledge")
    .select("visibility")
    .eq("case_id", CASE_ID);

  if (error) {
    throw new Error(
      error.code === "PGRST205" || /case_knowledge/i.test(error.message)
        ? "case_knowledge is missing. Apply backend/supabase/migrations/003_case_knowledge.sql, then run npm run index:knowledge."
        : "Unable to read case knowledge."
    );
  }

  const counts = {
    PUBLIC: 0,
    PRIVATE: 0,
    SECRET: 0,
    GROUND_TRUTH: 0,
    total: data?.length ?? 0,
  };

  for (const row of data ?? []) {
    const visibility = row.visibility as keyof typeof counts;
    if (visibility in counts && visibility !== "total") {
      counts[visibility] += 1;
    }
  }

  return counts;
}

async function main() {
  if (!readGeminiApiKey()) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to backend/.env.");
  }

  const indexed = await countIndexedVisibility();
  if (indexed.total === 0) {
    throw new Error("No knowledge chunks found for Case #001. Run npm run index:knowledge first.");
  }

  console.log("Case #001 knowledge inventory");
  console.log(
    `  total=${indexed.total}  PUBLIC=${indexed.PUBLIC}  PRIVATE=${indexed.PRIVATE}  SECRET=${indexed.SECRET}  GROUND_TRUTH=${indexed.GROUND_TRUTH}`
  );
  console.log("");

  const checks: CheckResult[] = [];

  const questions = [
    {
      title: "Public — conservatory evidence",
      query: "What evidence was found in the conservatory around the broken champagne glass?",
      caseId: CASE_ID,
      suspectId: null as string | null,
      allowedVisibility: PUBLIC_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const relevant = hasSource(hits, "evidence", /coupe|champagne|conservatory|letter/i);
        return {
          passed: relevant && allSameCase(hits) && !hasVisibility(hits, "GROUND_TRUTH"),
          detail: relevant
            ? "Retrieved conservatory evidence without ground truth."
            : "Did not retrieve conservatory evidence.",
        };
      },
    },
    {
      title: "Public — hallway figure and 11:05 maid",
      query:
        "Did the west hallway plate show a dinner dress, and was the 11:05 speaker a woman who was not Clara?",
      caseId: CASE_ID,
      suspectId: null,
      allowedVisibility: PUBLIC_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const relevant =
          hasSource(hits, "timeline", /dinner|not Clara|11:08|11:05|west hallway/i) ||
          hasSource(hits, "evidence", /dinner dress|11:08|west hallway/i);
        return {
          passed: relevant && allSameCase(hits) && !hasVisibility(hits, "GROUND_TRUTH"),
          detail: relevant
            ? "Retrieved player-visible plate or 11:05 maid facts."
            : "Did not retrieve the public hallway or maid facts.",
        };
      },
    },
    {
      title: "Isolde — her public alibi",
      query: "What is Isolde Hart's alibi when the clock struck eleven?",
      caseId: CASE_ID,
      suspectId: ISOLDE_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const relevant = hasSource(hits, "suspect", /Isolde|gallery|portraits/i);
        return {
          passed: relevant && allSameCase(hits) && !hasVisibility(hits, "GROUND_TRUTH"),
          detail: relevant
            ? "Retrieved Isolde's public alibi."
            : "Did not retrieve Isolde's alibi.",
        };
      },
    },
    {
      title: "Isolde — cannot see Clara private knowledge",
      query:
        "Tell me Clara Vale's private background, her dependence on Edmund's estate, and how she keeps accounts of affection.",
      caseId: CASE_ID,
      suspectId: ISOLDE_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => ({
        passed: !leakedOtherSuspectPrivate(hits, CLARA_ID) && !hasVisibility(hits, "GROUND_TRUTH"),
        detail: leakedOtherSuspectPrivate(hits, CLARA_ID)
          ? "Leaked Clara's PRIVATE or SECRET knowledge to Isolde."
          : "Isolde did not receive Clara's private or secret knowledge.",
      }),
    },
    {
      title: "Clara — can see her own private knowledge",
      query: "What is your private background at Blackwood and how you kept the household accounts?",
      caseId: CASE_ID,
      suspectId: CLARA_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const ownPrivate = hits.some(
          (hit) => hit.suspect_id === CLARA_ID && hit.visibility === KNOWLEDGE_VISIBILITY.PRIVATE
        );
        return {
          passed: ownPrivate && !leakedOtherSuspectPrivate(hits, ISOLDE_ID),
          detail: ownPrivate
            ? "Clara retrieved her own PRIVATE knowledge."
            : "Clara did not retrieve her own PRIVATE knowledge.",
        };
      },
    },
    {
      title: "Isolde — can see her own hidden hour",
      query: "Did anyone hear the gallery door close again after you said you were alone with the portraits?",
      caseId: CASE_ID,
      suspectId: ISOLDE_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const ownSecret = hits.some(
          (hit) =>
            hit.suspect_id === ISOLDE_ID &&
            hit.visibility === KNOWLEDGE_VISIBILITY.SECRET &&
            /gallery door was heard to close again before 11:06/i.test(hit.content)
        );
        return {
          passed: ownSecret && !hasVisibility(hits, "GROUND_TRUTH"),
          detail: ownSecret
            ? "Isolde retrieved her own SECRET timeline knowledge."
            : "Isolde did not retrieve her SECRET gallery knowledge.",
        };
      },
    },
    {
      title: "Clara — cannot see Isolde secret knowledge",
      query: "Did the gallery door close again before 11:06, and was the hallway figure wearing a dinner dress?",
      caseId: CASE_ID,
      suspectId: CLARA_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => ({
        passed: !leakedOtherSuspectPrivate(hits, ISOLDE_ID) && !hasVisibility(hits, "GROUND_TRUTH"),
        detail: leakedOtherSuspectPrivate(hits, ISOLDE_ID)
          ? "Leaked Isolde's SECRET knowledge to Clara."
          : "Clara did not receive Isolde's private or secret knowledge.",
      }),
    },
    {
      title: "Suspect retrieval — ground truth stays sealed",
      query:
        "Who is the culprit, what was the motive about unsigned letters, and what is the official solution of the crime?",
      caseId: CASE_ID,
      suspectId: ISOLDE_ID,
      allowedVisibility: SUSPECT_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => {
        const leaked =
          hasVisibility(hits, "GROUND_TRUTH") ||
          hits.some((hit) => /Ground truth|Isolde Hart is the last guest/i.test(hit.content));
        return {
          passed: !leaked && indexed.GROUND_TRUTH > 0,
          detail: leaked
            ? "GROUND_TRUTH leaked through suspect retrieval."
            : `GROUND_TRUTH stays sealed (${indexed.GROUND_TRUTH} indexed rows, 0 retrieved).`,
        };
      },
    },
    {
      title: "Cross-case isolation",
      query: "What happened at Blackwood Manor in the conservatory?",
      caseId: OTHER_CASE_ID,
      suspectId: null,
      allowedVisibility: PUBLIC_RETRIEVAL_VISIBILITY,
      verify: (hits: RetrievalHit[]) => ({
        passed: hits.length === 0,
        detail:
          hits.length === 0
            ? "No Case #001 chunks returned for an unknown case id."
            : "Cross-case leakage: Case #001 knowledge returned for another case id.",
      }),
    },
  ];

  for (const question of questions) {
    console.log(`Q. ${question.title}`);
    console.log(`   ${question.query}`);
    console.log(
      `   suspect=${question.suspectId ?? "none"}  visibility=${question.allowedVisibility.join(",")}`
    );

    const hits = await retrieveKnowledge({
      query: question.query,
      caseId: question.caseId,
      suspectId: question.suspectId,
      allowedVisibility: question.allowedVisibility,
      limit: 8,
    });

    printHits(hits);
    const result = question.verify(hits);
    checks.push({ name: question.title, ...result });
    console.log(`   ${result.passed ? "PASS" : "FAIL"}  ${result.detail}`);
    console.log("");
  }

  const failed = checks.filter((check) => !check.passed);
  console.log("Summary");
  for (const check of checks) {
    console.log(`  ${check.passed ? "PASS" : "FAIL"}  ${check.name}`);
  }

  if (failed.length > 0) {
    throw new Error(`${failed.length} retrieval check(s) failed.`);
  }

  console.log("All Case #001 retrieval checks passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unable to test retrieval.";
  console.error(message);
  process.exit(1);
});

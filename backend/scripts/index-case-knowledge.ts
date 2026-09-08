import { supabase } from "../src/config/supabase.ts";
import { readGeminiApiKey } from "../src/config/embeddings.ts";
import { indexCaseKnowledge, isMissingKnowledgeTable } from "../src/services/rag/indexer.ts";

const BLACKWOOD_CASE_ID = "a1000001-0001-4000-8000-000000000001";
const BLACKWOOD_SLUG = "the-last-guest-at-blackwood-manor";

async function resolveCaseId(input?: string) {
  const value = input?.trim() || BLACKWOOD_CASE_ID;
  if (value === "001" || value === BLACKWOOD_SLUG) {
    return BLACKWOOD_CASE_ID;
  }
  if (value === "002" || value === "the-dead-frequency") {
    return "a1000002-0002-4000-8000-000000000002";
  }
  if (value === "003" || value === "the-passenger-who-never-boarded") {
    return "a1000003-0003-4000-8000-000000000003";
  }
  if (value === "all") {
    return "all";
  }

  const byId = await supabase.from("cases").select("id").eq("id", value).maybeSingle();
  if (byId.data?.id) {
    return byId.data.id;
  }

  const bySlug = await supabase.from("cases").select("id").eq("slug", value).maybeSingle();
  if (bySlug.data?.id) {
    return bySlug.data.id;
  }

  throw new Error("Case not found.");
}

async function assertReady() {
  const problems: string[] = [];
  const probe = await supabase.from("case_knowledge").select("id").limit(1);
  if (isMissingKnowledgeTable(probe.error)) {
    problems.push(
      "case_knowledge is missing. Apply backend/supabase/migrations/003_case_knowledge.sql in the Supabase SQL editor."
    );
  }
  if (!readGeminiApiKey()) {
    problems.push("Gemini is not configured. Add GEMINI_API_KEY to backend/.env.");
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
}

async function indexOne(caseId: string) {
  const result = await indexCaseKnowledge(caseId);
  console.log(`Indexed knowledge for ${result.title}`);
  console.log(`case_id: ${result.caseId}`);
  console.log(`chunks: ${result.indexed}`);
  console.log("visibility:", formatCounts(result.counts, ["PUBLIC", "PRIVATE", "SECRET", "GROUND_TRUTH"]));
  console.log(
    "sources:",
    formatCounts(result.counts, ["case", "suspect", "evidence", "timeline", "ground_truth"])
  );
  return result;
}

async function main() {
  await assertReady();
  const input = process.argv[2]?.trim();
  if (input === "all") {
    for (const id of [
      BLACKWOOD_CASE_ID,
      "a1000002-0002-4000-8000-000000000002",
      "a1000003-0003-4000-8000-000000000003",
    ]) {
      await indexOne(id);
      console.log("");
    }
    return;
  }
  await indexOne(await resolveCaseId(input));
}

function formatCounts(counts: Record<string, number>, keys: string[]) {
  return keys.map((key) => `${key}=${counts[key] ?? 0}`).join("  ");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unable to index case knowledge.";
  console.error(message);
  process.exit(1);
});

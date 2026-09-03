// Change model or dimensions here. The case_knowledge.embedding column
// and match_case_knowledge() must stay in sync with `dimensions`.
export const embeddingConfig = {
  model: "gemini-embedding-001",
  dimensions: 768,
  batchSize: 1,
  retryAttempts: 4,
  retryBaseMs: 800,
} as const;

export function readGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
}

export function requireGeminiApiKey() {
  const key = readGeminiApiKey();
  if (!key) {
    throw new Error("Gemini is not configured.");
  }
  return key;
}

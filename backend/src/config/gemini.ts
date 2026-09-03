import { readGeminiApiKey, requireGeminiApiKey } from "./embeddings.js";

export const geminiChatConfig = {
  timeoutMs: 25000,
  retryAttempts: 4,
  retryBaseMs: 900,
  maxOutputTokens: 1024,
  temperature: 0.65,
} as const;

export function getGeminiChatModel() {
  return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-3.5-flash";
}

export function getGeminiChatModels() {
  const preferred = getGeminiChatModel();
  return [...new Set([preferred, "gemini-3.5-flash", "gemini-3.6-flash"])];
}

export { readGeminiApiKey, requireGeminiApiKey };

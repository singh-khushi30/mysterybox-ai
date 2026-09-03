import {
  geminiChatConfig,
  getGeminiChatModels,
  requireGeminiApiKey,
} from "../../config/gemini.js";
import { HttpError } from "../../utils/http.js";

type GeminiRole = "user" | "model";

export type GeminiChatMessage = {
  role: GeminiRole;
  content: string;
};

type GeminiClient = {
  models: {
    generateContent: (input: {
      model: string;
      contents: Array<{ role: GeminiRole; parts: Array<{ text: string }> }>;
      config: {
        systemInstruction: string;
        temperature: number;
        maxOutputTokens: number;
      };
    }) => Promise<{
      text?: string;
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    }>;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate|quota|503|unavailable|timeout|RESOURCE_EXHAUSTED/i.test(message);
}

function classifyChatError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }
  if (error instanceof Error && error.message === "Gemini is not configured.") {
    return new HttpError(503, "The interview cannot be recorded right now.");
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/429|rate|quota|RESOURCE_EXHAUSTED/i.test(message)) {
    return new HttpError(429, "The room needs a moment.");
  }
  if (/timeout/i.test(message)) {
    return new HttpError(503, "The statement took too long.");
  }
  return new HttpError(503, "Unable to take a statement.");
}

function withTimeout<T>(work: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

let clientPromise: Promise<GeminiClient> | null = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
      return new GoogleGenAI({ apiKey: requireGeminiApiKey() }) as GeminiClient;
    });
  }
  return clientPromise;
}

async function withRetry<T>(work: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < geminiChatConfig.retryAttempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === geminiChatConfig.retryAttempts - 1) {
        break;
      }
      await sleep(geminiChatConfig.retryBaseMs * 2 ** attempt);
    }
  }

  throw lastError;
}

function extractModelText(response: {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}) {
  if (response.text?.trim()) {
    return response.text;
  }

  return (response.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

export function sanitizeModelText(raw: string) {
  const cleaned = raw
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    throw new HttpError(503, "Unable to take a statement.");
  }

  if (
    /GROUND_TRUTH|as an AI|language model|Gemini API|system prompt|retrieved context/i.test(
      cleaned
    )
  ) {
    return "I don't remember that clearly enough to swear to it.";
  }

  if (cleaned.length <= 900) {
    return cleaned;
  }

  const clipped = cleaned.slice(0, 900);
  const lastStop = Math.max(
    clipped.lastIndexOf("."),
    clipped.lastIndexOf("?"),
    clipped.lastIndexOf("!")
  );
  return lastStop > 120 ? clipped.slice(0, lastStop + 1) : clipped;
}

export async function generateGeminiText(input: {
  systemInstruction: string;
  messages: GeminiChatMessage[];
}) {
  if (input.messages.length === 0) {
    throw new HttpError(400, "Missing interview question");
  }

  const client = await getClient();
  const contents = input.messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));

  const models = getGeminiChatModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      const response = await withRetry(() =>
        withTimeout(
          client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: input.systemInstruction,
              temperature: geminiChatConfig.temperature,
              maxOutputTokens: geminiChatConfig.maxOutputTokens,
            },
          }),
          geminiChatConfig.timeoutMs
        )
      );

      return sanitizeModelText(extractModelText(response));
    } catch (error) {
      lastError = error;
      if (error instanceof HttpError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      if (!/404|NOT_FOUND|not found|unknown model/i.test(message)) {
        throw classifyChatError(error);
      }
    }
  }

  throw classifyChatError(lastError);
}

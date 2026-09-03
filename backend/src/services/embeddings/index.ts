import { Embeddings } from "@langchain/core/embeddings";
import { embeddingConfig, requireGeminiApiKey } from "../../config/embeddings.js";

type EmbeddingTask = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

type GeminiClient = {
  models: {
    embedContent: (input: {
      model: string;
      contents: string[];
      config: {
        taskType: EmbeddingTask;
        outputDimensionality: number;
      };
    }) => Promise<{
      embeddings?: Array<{ values?: number[] }>;
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

function sanitizeEmbeddingError(error: unknown) {
  if (error instanceof Error && error.message === "Gemini is not configured.") {
    return error;
  }
  return new Error("Unable to create embeddings.");
}

function l2Normalize(values: number[]) {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) {
    return values;
  }
  return values.map((value) => value / norm);
}

function assertDimension(values: number[]) {
  if (values.length < embeddingConfig.dimensions) {
    throw new Error("Unable to create embeddings.");
  }

  const sized =
    values.length === embeddingConfig.dimensions
      ? values
      : values.slice(0, embeddingConfig.dimensions);

  return l2Normalize(sized);
}

async function withRetry<T>(work: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < embeddingConfig.retryAttempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === embeddingConfig.retryAttempts - 1) {
        break;
      }
      await sleep(embeddingConfig.retryBaseMs * 2 ** attempt);
    }
  }

  throw sanitizeEmbeddingError(lastError);
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

async function embedTexts(texts: string[], taskType: EmbeddingTask) {
  const client = await getClient();
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += embeddingConfig.batchSize) {
    const batch = texts.slice(index, index + embeddingConfig.batchSize);
    const response = await withRetry(() =>
      client.models.embedContent({
        model: embeddingConfig.model,
        contents: batch,
        config: {
          taskType,
          outputDimensionality: embeddingConfig.dimensions,
        },
      })
    );

    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== batch.length) {
      throw new Error("Unable to create embeddings.");
    }

    for (const embedding of embeddings) {
      vectors.push(assertDimension(embedding.values ?? []));
    }

    if (index + embeddingConfig.batchSize < texts.length) {
      await sleep(120);
    }
  }

  return vectors;
}

export class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  embedDocuments(texts: string[]) {
    return embedTexts(texts, "RETRIEVAL_DOCUMENT");
  }

  async embedQuery(text: string) {
    const [values] = await embedTexts([text], "RETRIEVAL_QUERY");
    return values;
  }
}

export async function embedQuery(text: string) {
  return new GeminiEmbeddings().embedQuery(text);
}

export async function embedDocuments(texts: string[]) {
  return new GeminiEmbeddings().embedDocuments(texts);
}

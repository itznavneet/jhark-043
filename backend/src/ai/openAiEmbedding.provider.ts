import OpenAI from "openai";
import type { AppEnvironment } from "../config/environment.js";
import {
  semanticEmbeddingDimensions,
  type EmbeddingProvider,
  type EmbeddingResult,
} from "../types/matching.js";
import { AiProviderUnavailableError } from "./problemAnalysis.errors.js";

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly modelName: string;
  private readonly client: OpenAI | null;

  constructor(environment: AppEnvironment) {
    this.modelName = environment.matchingEmbeddingModel;
    this.client = environment.openAiApiKey
      ? new OpenAI({
          apiKey: environment.openAiApiKey,
          timeout: 30_000,
          maxRetries: 1,
        })
      : null;
  }

  async createEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.client) {
      throw new AiProviderUnavailableError(
        "OPENAI_API_KEY is not configured for university matching",
      );
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: text,
        encoding_format: "float",
        ...(this.modelName.startsWith("text-embedding-3")
          ? { dimensions: semanticEmbeddingDimensions }
          : {}),
      });
      const vector = response.data[0]?.embedding;
      if (!vector || vector.length !== semanticEmbeddingDimensions) {
        throw new AiProviderUnavailableError(
          "The embedding provider returned an unexpected vector size",
        );
      }
      return {
        vector,
        modelName: response.model || this.modelName,
        dimensions: vector.length,
      };
    } catch (error) {
      if (error instanceof AiProviderUnavailableError) throw error;
      throw new AiProviderUnavailableError(
        "OpenAI could not create the university matching embedding",
      );
    }
  }
}

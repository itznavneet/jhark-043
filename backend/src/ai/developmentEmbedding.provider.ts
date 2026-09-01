import { createDevelopmentEmbedding } from "../utils/semanticEmbedding.js";
import {
  semanticEmbeddingDimensions,
  type EmbeddingProvider,
  type EmbeddingResult,
} from "../types/matching.js";

export class DevelopmentEmbeddingProvider implements EmbeddingProvider {
  readonly modelName = "development-token-hash-1536";

  async createEmbedding(text: string): Promise<EmbeddingResult> {
    return {
      vector: createDevelopmentEmbedding(text),
      modelName: this.modelName,
      dimensions: semanticEmbeddingDimensions,
    };
  }
}

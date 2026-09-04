import type { ProblemForAnalysis } from "../types/ai.js";
import type { EmbeddingProvider } from "../types/matching.js";
import { UniversityMatchingRepository } from "../repositories/university-matching.repository.js";

const productionSimilarityThreshold = 0.78;
const developmentSimilarityThreshold = 0.55;
const developmentTokenOverlapThreshold = 0.28;

export interface PotentialProblemDuplicate {
  id: string;
  title: string;
  status: string;
  similarity: number;
}

export interface ProblemDuplicateDetector {
  findPotentialDuplicate(
    problemId: string,
    problem: ProblemForAnalysis,
  ): Promise<PotentialProblemDuplicate | null>;
}

export class SemanticProblemDuplicateService implements ProblemDuplicateDetector {
  constructor(
    private readonly repository = new UniversityMatchingRepository(),
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async findPotentialDuplicate(
    problemId: string,
    problem: ProblemForAnalysis,
  ): Promise<PotentialProblemDuplicate | null> {
    const contentText = buildCompleteProblemText(problem);
    const embedding = await this.embeddingProvider.createEmbedding(contentText);
    await this.repository.upsertProblemEmbedding({
      problemId,
      contentText,
      embedding: embedding.vector,
      embeddingModel: embedding.modelName,
      dimensions: embedding.dimensions,
      metadata: { source: "submission_duplicate_detection" },
    });
    const candidates = await this.repository.findDuplicates(
      problemId,
      embedding.vector,
      embedding.modelName,
    );
    const candidate = candidates.find((item) =>
      this.isDuplicate(item.similarity, contentText, item.contentText),
    );
    return candidate
      ? {
          id: candidate.id,
          title: candidate.title,
          status: candidate.status,
          similarity: candidate.similarity,
        }
      : null;
  }

  private isDuplicate(
    similarity: number,
    currentText: string,
    existingText: string,
  ): boolean {
    if (similarity >= productionSimilarityThreshold) return true;
    if (!this.embeddingProvider.modelName.startsWith("development-")) {
      return false;
    }
    return (
      similarity >= developmentSimilarityThreshold &&
      tokenOverlap(currentText, existingText) >=
        developmentTokenOverlapThreshold
    );
  }
}

export function buildCompleteProblemText(problem: ProblemForAnalysis): string {
  return [
    `Title: ${problem.title}`,
    `Description: ${problem.description}`,
    problem.category ? `Category: ${problem.category}` : null,
    problem.location ? `Location: ${problem.location}` : null,
    problem.district ? `District: ${problem.district}` : null,
    problem.block ? `Block: ${problem.block}` : null,
    problem.villageLocality ? `Locality: ${problem.villageLocality}` : null,
    problem.societalContext
      ? `Societal context: ${problem.societalContext}`
      : null,
    problem.desiredOutcome
      ? `Desired outcome: ${problem.desiredOutcome}`
      : null,
    problem.supportingInformation
      ? `Supporting information: ${problem.supportingInformation}`
      : null,
    ...problem.evidence.map(
      (item) => `Evidence: ${item.title} ${item.description ?? ""}`,
    ),
  ]
    .filter(Boolean)
    .join(" | ");
}

function tokenOverlap(first: string, second: string): number {
  const firstTokens = meaningfulTokens(first);
  const secondTokens = meaningfulTokens(second);
  if (!firstTokens.size || !secondTokens.size) return 0;
  let shared = 0;
  for (const token of firstTokens) if (secondTokens.has(token)) shared += 1;
  return shared / Math.min(firstTokens.size, secondTokens.size);
}

function meaningfulTokens(value: string): Set<string> {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "for",
    "from",
    "in",
    "is",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
  ]);
  return new Set(
    (value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
      .filter((token) => token.length > 2 && !stopWords.has(token))
      .map((token) => (token.endsWith("s") ? token.slice(0, -1) : token)),
  );
}

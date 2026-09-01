import type {
  MatchDecision,
  MatchingProcessingStatus,
  SearchableSourceType,
} from "@prisma/client";

export const semanticEmbeddingDimensions = 1536;

export interface EmbeddingResult {
  vector: number[];
  modelName: string;
  dimensions: number;
}

export interface EmbeddingProvider {
  modelName: string;
  createEmbedding(text: string): Promise<EmbeddingResult>;
}

export interface SearchableKnowledgeRecord {
  id: string;
  universityId: string;
  universityName: string;
  sourceType: SearchableSourceType;
  sourceId: string;
  contentText: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface UniversityCandidate {
  universityId: string;
  universityName: string;
  evidence: SearchableKnowledgeRecord[];
  retrievalScore: number;
}

export interface RankingOutput {
  rankings: Array<{
    universityId: string;
    rank: number;
    matchScore: number;
    justification: string;
    evidenceSourceIds: string[];
  }>;
}

export interface UniversityRankingProvider {
  modelName: string;
  rank(
    problemText: string,
    candidates: UniversityCandidate[],
  ): Promise<unknown>;
}

export interface MatchingRunView {
  id: string;
  problemId: string;
  processingStatus: MatchingProcessingStatus;
  embeddingModel: string;
  rankingModel: string;
  candidateCount: number;
  failureReason: string | null;
  generatedAt: string;
  processedAt: string | null;
}

export interface MatchEvidenceView {
  sourceType: SearchableSourceType;
  sourceId: string;
  contentText: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface RecommendationView {
  id: string;
  university: { id: string; name: string; shortName: string | null };
  rank: number;
  matchScore: number;
  decision: MatchDecision;
  justification: string;
  evidence: MatchEvidenceView[];
  generatedAt: string;
  approvedAt: string | null;
  removedAt: string | null;
}

export interface MatchingResultView {
  problemId: string;
  latestRun: MatchingRunView | null;
  recommendations: RecommendationView[];
}

export interface DuplicateProblemView {
  existingProblem: { id: string; title: string; status: string };
  similarity: number;
}

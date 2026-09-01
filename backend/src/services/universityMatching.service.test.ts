import { MatchingProcessingStatus, ProblemStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { AiProviderUnavailableError } from "../ai/problemAnalysis.errors.js";
import {
  UniversityMatchingService,
  type UniversityMatchingRepositoryContract,
} from "./universityMatching.service.js";
import type {
  EmbeddingProvider,
  UniversityRankingProvider,
} from "../types/matching.js";

describe("UniversityMatchingService", () => {
  it("persists provider failure and retries a failed matching run", async () => {
    let runCount = 0;
    const problem = {
      id: "00000000-0000-4000-8000-000000000028",
      title: "Water access challenge",
      description:
        "A community water access challenge requiring public-interest research.",
      societalContext: null,
      geography: null,
      district: null,
      block: null,
      villageLocality: null,
      desiredOutcome: null,
      supportingInformation: null,
      currentStatus: ProblemStatus.MINISTRY_APPROVED,
      category: { name: "Water" },
      aiAnalyses: [],
    } as unknown as NonNullable<
      Awaited<
        ReturnType<
          UniversityMatchingRepositoryContract["findProblemForMatching"]
        >
      >
    >;
    const failedRun = {
      id: "00000000-0000-4000-8000-000000000032",
      problemId: problem.id,
      processingStatus: MatchingProcessingStatus.FAILED,
      embeddingModel: "test-embedding",
      rankingModel: "test-ranking",
      candidateCount: 1,
      failureReason: "provider unavailable",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      processedAt: new Date("2026-01-01T00:00:00.000Z"),
      matches: [],
    } as unknown as Awaited<
      ReturnType<UniversityMatchingRepositoryContract["findLatestRun"]>
    >;
    let failureReason: string | undefined;
    const repository = {
      findProblemForMatching: async () => problem,
      findApprovedUniversities: async () => [],
      findApprovedUniversity: async () => null,
      upsertUniversityEmbedding: async () => undefined,
      upsertProblemEmbedding: async () => undefined,
      retrieveKnowledge: async () => [
        {
          id: "00000000-0000-4000-8000-000000000033",
          universityId: "00000000-0000-4000-8000-000000000016",
          universityName: "Synthetic University",
          sourceType: "RESEARCH_AREA" as const,
          sourceId: "00000000-0000-4000-8000-000000000034",
          contentText: "Rural water infrastructure",
          similarity: 0.9,
          metadata: {},
        },
      ],
      findDuplicates: async () => [],
      createMatchingRun: async () => {
        runCount += 1;
        return {
          ...failedRun,
          id: `run-${runCount}`,
          processingStatus: MatchingProcessingStatus.PENDING,
        };
      },
      markRunProcessing: async () => undefined,
      markRunFailed: async (_runId: string, reason: string) => {
        failureReason = reason;
        return { ...failedRun, failureReason: reason };
      },
      completeRun: async () => failedRun,
      findLatestRun: async () => failedRun,
      findLatestCompletedRun: async () => null,
      findLatestFailedRun: async () => failedRun,
      approveRecommendations: async () => failedRun,
      removeRecommendation: async () => {
        throw new Error("not used");
      },
      addRecommendation: async () => {
        throw new Error("not used");
      },
      listAvailableUniversities: async () => [],
    } as unknown as UniversityMatchingRepositoryContract;
    const embeddingProvider: EmbeddingProvider = {
      modelName: "test-embedding",
      createEmbedding: async () => ({
        vector: Array.from({ length: 1536 }, () => 0),
        modelName: "test-embedding",
        dimensions: 1536,
      }),
    };
    const rankingProvider: UniversityRankingProvider = {
      modelName: "test-ranking",
      rank: async () => {
        throw new AiProviderUnavailableError("ranking unavailable");
      },
    };
    const service = new UniversityMatchingService(
      repository,
      embeddingProvider,
      rankingProvider,
    );

    const first = await service.triggerMatching(problem.id);
    const second = await service.retryMatching(problem.id);

    expect(runCount).toBe(2);
    expect(first.latestRun?.processingStatus).toBe(
      MatchingProcessingStatus.FAILED,
    );
    expect(failureReason).toBe("ranking unavailable");
    expect(second.latestRun?.processingStatus).toBe(
      MatchingProcessingStatus.FAILED,
    );
  });
});

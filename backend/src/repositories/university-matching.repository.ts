import { randomUUID } from "node:crypto";
import {
  MatchDecision,
  MatchingProcessingStatus,
  Prisma,
  ProblemStatus,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import type {
  MatchEvidenceView,
  SearchableKnowledgeRecord,
  UniversityCandidate,
} from "../types/matching.js";
import { toVectorLiteral } from "../utils/semanticEmbedding.js";
import { AppError } from "../utils/appError.js";

const universityKnowledgeInclude = {
  faculty: { orderBy: { name: "asc" as const } },
  researchAreas: { orderBy: { name: "asc" as const } },
  labs: { orderBy: { name: "asc" as const } },
  facilities: { orderBy: { name: "asc" as const } },
  previousProjects: { orderBy: { title: "asc" as const } },
} as const;

const recommendationInclude = {
  university: { select: { id: true, name: true, shortName: true } },
} as const;

export type UniversityKnowledgeRecord = Prisma.UniversityGetPayload<{
  include: typeof universityKnowledgeInclude;
}>;
export type RecommendationRecord = Prisma.ProblemUniversityMatchGetPayload<{
  include: typeof recommendationInclude;
}>;
export type MatchingRunRecord = Prisma.UniversityMatchingRunGetPayload<{
  include: { matches: { include: typeof recommendationInclude } };
}>;

interface KnowledgeRow {
  id: string;
  universityId: string;
  universityName: string;
  sourceType: SearchableKnowledgeRecord["sourceType"];
  sourceId: string;
  contentText: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

interface DuplicateRow {
  id: string;
  title: string;
  currentStatus: string;
  contentText: string;
  similarity: number;
}

export class UniversityMatchingRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findApprovedUniversities(): Promise<UniversityKnowledgeRecord[]> {
    return this.client.university.findMany({
      where: { isApproved: true },
      include: universityKnowledgeInclude,
      orderBy: { name: "asc" },
    });
  }

  findApprovedUniversity(
    universityId: string,
  ): Promise<UniversityKnowledgeRecord | null> {
    return this.client.university.findFirst({
      where: { id: universityId, isApproved: true },
      include: universityKnowledgeInclude,
    });
  }

  async upsertUniversityEmbedding(input: {
    universityId: string;
    sourceType: string;
    sourceId: string;
    contentText: string;
    embedding: number[];
    embeddingModel: string;
    dimensions: number;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const vector = toVectorLiteral(input.embedding);
    await this.client.$executeRaw(Prisma.sql`
      INSERT INTO "UniversityKnowledgeEmbedding"
        ("id", "universityId", "sourceType", "sourceId", "contentText", "embedding", "embeddingModel", "dimensions", "metadata", "createdAt", "updatedAt")
      VALUES
        (${randomUUID()}::uuid, ${input.universityId}::uuid, ${input.sourceType}::"SearchableSourceType", ${input.sourceId}::uuid, ${input.contentText}, ${vector}::vector, ${input.embeddingModel}, ${input.dimensions}, ${JSON.stringify(input.metadata)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("sourceType", "sourceId", "embeddingModel") DO UPDATE SET
        "universityId" = EXCLUDED."universityId",
        "contentText" = EXCLUDED."contentText",
        "embedding" = EXCLUDED."embedding",
        "dimensions" = EXCLUDED."dimensions",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP
    `);
  }

  async upsertProblemEmbedding(input: {
    problemId: string;
    contentText: string;
    embedding: number[];
    embeddingModel: string;
    dimensions: number;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const vector = toVectorLiteral(input.embedding);
    await this.client.$executeRaw(Prisma.sql`
      INSERT INTO "ProblemEmbedding"
        ("id", "problemId", "contentText", "embedding", "embeddingModel", "dimensions", "metadata", "createdAt", "updatedAt")
      VALUES
        (${randomUUID()}::uuid, ${input.problemId}::uuid, ${input.contentText}, ${vector}::vector, ${input.embeddingModel}, ${input.dimensions}, ${JSON.stringify(input.metadata)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("problemId", "embeddingModel") DO UPDATE SET
        "contentText" = EXCLUDED."contentText",
        "embedding" = EXCLUDED."embedding",
        "dimensions" = EXCLUDED."dimensions",
        "metadata" = EXCLUDED."metadata",
        "updatedAt" = CURRENT_TIMESTAMP
    `);
  }

  async retrieveKnowledge(
    embedding: number[],
    embeddingModel: string,
    limit = 50,
    universityId?: string,
  ): Promise<SearchableKnowledgeRecord[]> {
    const vector = toVectorLiteral(embedding);
    const rows = await this.client.$queryRaw<KnowledgeRow[]>(Prisma.sql`
      SELECT
        e."id",
        e."universityId",
        u."name" AS "universityName",
        e."sourceType"::text AS "sourceType",
        e."sourceId",
        e."contentText",
        (1 - (e."embedding" <=> ${vector}::vector))::double precision AS "similarity",
        e."metadata"
      FROM "UniversityKnowledgeEmbedding" e
      INNER JOIN "University" u ON u."id" = e."universityId"
      WHERE e."embedding" IS NOT NULL
        AND e."embeddingModel" = ${embeddingModel}
        AND u."isApproved" = true
        ${universityId ? Prisma.sql`AND e."universityId" = ${universityId}::uuid` : Prisma.empty}
      ORDER BY e."embedding" <=> ${vector}::vector ASC
      LIMIT ${limit}
    `);
    return rows.map(toKnowledgeRecord);
  }

  async findDuplicates(
    problemId: string,
    embedding: number[],
    embeddingModel: string,
    limit = 10,
  ): Promise<
    Array<{
      id: string;
      title: string;
      status: string;
      contentText: string;
      similarity: number;
    }>
  > {
    const vector = toVectorLiteral(embedding);
    const rows = await this.client.$queryRaw<DuplicateRow[]>(Prisma.sql`
      SELECT
        p."id",
        p."title",
        p."currentStatus"::text AS "currentStatus",
        e."contentText",
        (1 - (e."embedding" <=> ${vector}::vector))::double precision AS "similarity"
      FROM "ProblemEmbedding" e
      INNER JOIN "Problem" p ON p."id" = e."problemId"
      WHERE e."problemId" <> ${problemId}::uuid
        AND e."embedding" IS NOT NULL
        AND e."embeddingModel" = ${embeddingModel}
      ORDER BY e."embedding" <=> ${vector}::vector ASC
      LIMIT ${limit}
    `);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.currentStatus,
      contentText: row.contentText,
      similarity: row.similarity,
    }));
  }

  findProblemForMatching(problemId: string) {
    return this.client.problem.findUnique({
      where: { id: problemId },
      include: {
        category: { select: { name: true } },
        aiAnalyses: {
          where: { processingStatus: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            summary: true,
            keywords: true,
            requiredExpertise: true,
            requiredFacilities: true,
            potentialSolutionAreas: true,
          },
        },
      },
    });
  }

  createMatchingRun(input: {
    problemId: string;
    embeddingModel: string;
    rankingModel: string;
  }) {
    return this.client.universityMatchingRun.create({
      data: {
        problemId: input.problemId,
        processingStatus: MatchingProcessingStatus.PENDING,
        embeddingModel: input.embeddingModel,
        rankingModel: input.rankingModel,
      },
    });
  }

  markRunProcessing(runId: string) {
    return this.client.universityMatchingRun.update({
      where: { id: runId },
      data: { processingStatus: MatchingProcessingStatus.PROCESSING },
    });
  }

  markRunFailed(runId: string, failureReason: string) {
    return this.client.universityMatchingRun.update({
      where: { id: runId },
      data: {
        processingStatus: MatchingProcessingStatus.FAILED,
        failureReason,
        processedAt: new Date(),
      },
    });
  }

  async completeRun(
    runId: string,
    candidates: UniversityCandidate[],
    rankings: RankingOutputForPersistence[],
  ): Promise<MatchingRunRecord> {
    return this.client.$transaction(async (transaction) => {
      const run = await transaction.universityMatchingRun.findUniqueOrThrow({
        where: { id: runId },
      });

      for (const ranking of rankings) {
        const candidate = candidates.find(
          (item) => item.universityId === ranking.universityId,
        );
        if (!candidate) continue;
        const evidence = candidate.evidence.filter((item) =>
          ranking.evidenceSourceIds.includes(item.sourceId),
        );
        const existing = await transaction.problemUniversityMatch.findUnique({
          where: {
            problemId_universityId: {
              problemId: run.problemId,
              universityId: ranking.universityId,
            },
          },
          select: { id: true, decision: true },
        });
        if (
          existing?.decision !== undefined &&
          existing.decision !== MatchDecision.RECOMMENDED
        ) {
          continue;
        }

        const data = {
          problemId: run.problemId,
          universityId: ranking.universityId,
          matchingRunId: run.id,
          matchScore: ranking.matchScore,
          rank: ranking.rank,
          decision: MatchDecision.RECOMMENDED,
          justification: ranking.justification,
          matchingMetadata: {
            retrievalScore: candidate.retrievalScore,
            rankingModel: run.rankingModel,
          } as Prisma.InputJsonValue,
          evidence: evidence.map(
            toEvidenceJson,
          ) as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
        };
        if (existing) {
          await transaction.problemUniversityMatch.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await transaction.problemUniversityMatch.create({ data });
        }
      }

      const problem = await transaction.problem.findUniqueOrThrow({
        where: { id: run.problemId },
        select: { currentStatus: true },
      });
      if (problem.currentStatus === ProblemStatus.MINISTRY_APPROVED) {
        await writeStatusTransition(
          transaction,
          run.problemId,
          ProblemStatus.MINISTRY_APPROVED,
          ProblemStatus.AI_UNIVERSITY_MATCHED,
        );
        await writeStatusTransition(
          transaction,
          run.problemId,
          ProblemStatus.AI_UNIVERSITY_MATCHED,
          ProblemStatus.UNIVERSITIES_RECOMMENDED,
        );
      } else if (
        problem.currentStatus === ProblemStatus.AI_UNIVERSITY_MATCHED
      ) {
        await writeStatusTransition(
          transaction,
          run.problemId,
          ProblemStatus.AI_UNIVERSITY_MATCHED,
          ProblemStatus.UNIVERSITIES_RECOMMENDED,
        );
      }

      await transaction.universityMatchingRun.update({
        where: { id: run.id },
        data: {
          processingStatus: MatchingProcessingStatus.COMPLETED,
          candidateCount: candidates.length,
          failureReason: null,
          processedAt: new Date(),
        },
      });

      return transaction.universityMatchingRun.findUniqueOrThrow({
        where: { id: run.id },
        include: {
          matches: { include: recommendationInclude, orderBy: { rank: "asc" } },
        },
      });
    });
  }

  findLatestCompletedRun(problemId: string): Promise<MatchingRunRecord | null> {
    return this.client.universityMatchingRun.findFirst({
      where: {
        problemId,
        processingStatus: MatchingProcessingStatus.COMPLETED,
      },
      orderBy: { createdAt: "desc" },
      include: {
        matches: {
          include: recommendationInclude,
          orderBy: { rank: "asc" },
        },
      },
    });
  }

  findLatestRun(problemId: string): Promise<MatchingRunRecord | null> {
    return this.client.universityMatchingRun.findFirst({
      where: { problemId },
      orderBy: { createdAt: "desc" },
      include: {
        matches: {
          include: recommendationInclude,
          orderBy: { rank: "asc" },
        },
      },
    });
  }

  findLatestFailedRun(problemId: string) {
    return this.client.universityMatchingRun.findFirst({
      where: {
        problemId,
        processingStatus: MatchingProcessingStatus.FAILED,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveRecommendations(
    problemId: string,
    ministryUserId: string,
    matchIds: string[],
  ): Promise<MatchingRunRecord> {
    return this.client.$transaction(async (transaction) => {
      const run = await transaction.universityMatchingRun.findFirstOrThrow({
        where: {
          problemId,
          processingStatus: MatchingProcessingStatus.COMPLETED,
        },
        orderBy: { createdAt: "desc" },
      });
      const problem = await transaction.problem.findUniqueOrThrow({
        where: { id: problemId },
        select: { currentStatus: true },
      });
      if (problem.currentStatus !== ProblemStatus.UNIVERSITIES_RECOMMENDED) {
        throw new AppError(
          "Recommendations can only be approved while awaiting Ministry review",
          409,
          "RECOMMENDATION_APPROVAL_NOT_AVAILABLE",
        );
      }
      const updated = await transaction.problemUniversityMatch.updateMany({
        where: {
          id: { in: matchIds },
          problemId,
          matchingRunId: run.id,
          decision: MatchDecision.RECOMMENDED,
        },
        data: {
          decision: MatchDecision.APPROVED,
          approvedById: ministryUserId,
          approvedAt: new Date(),
        },
      });
      if (updated.count !== matchIds.length) {
        throw new AppError(
          "One or more recommendations are unavailable for approval",
          409,
          "RECOMMENDATION_CONFLICT",
        );
      }

      await writeStatusTransition(
        transaction,
        problemId,
        ProblemStatus.UNIVERSITIES_RECOMMENDED,
        ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
        ministryUserId,
      );
      return transaction.universityMatchingRun.findUniqueOrThrow({
        where: { id: run.id },
        include: {
          matches: { include: recommendationInclude, orderBy: { rank: "asc" } },
        },
      });
    });
  }

  async removeRecommendation(
    problemId: string,
    matchId: string,
    ministryUserId: string,
  ): Promise<RecommendationRecord> {
    const match = await this.client.problemUniversityMatch.findFirst({
      where: { id: matchId, problemId, decision: MatchDecision.RECOMMENDED },
    });
    if (!match) {
      throw new AppError(
        "Recommendation not found",
        404,
        "RECOMMENDATION_NOT_FOUND",
      );
    }
    return this.client.problemUniversityMatch.update({
      where: { id: match.id },
      data: {
        decision: MatchDecision.REMOVED,
        removedById: ministryUserId,
        removedAt: new Date(),
      },
      include: recommendationInclude,
    });
  }

  async addRecommendation(
    problemId: string,
    universityId: string,
    runId: string,
    ranking: RankingOutputForPersistence,
    candidate: UniversityCandidate,
  ): Promise<RecommendationRecord> {
    const existing = await this.client.problemUniversityMatch.findUnique({
      where: { problemId_universityId: { problemId, universityId } },
    });
    if (existing) {
      throw new AppError(
        "This university already has a recommendation for the problem",
        409,
        "RECOMMENDATION_ALREADY_EXISTS",
      );
    }
    const latest = await this.client.problemUniversityMatch.aggregate({
      where: { matchingRunId: runId },
      _max: { rank: true },
    });
    return this.client.problemUniversityMatch.create({
      data: {
        problemId,
        universityId,
        matchingRunId: runId,
        matchScore: ranking.matchScore,
        rank: (latest._max.rank ?? 0) + 1,
        decision: MatchDecision.RECOMMENDED,
        justification: ranking.justification,
        matchingMetadata: { source: "MINISTRY_ADDED" },
        evidence: candidate.evidence.map(
          toEvidenceJson,
        ) as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
      include: recommendationInclude,
    });
  }

  listAvailableUniversities(problemId: string) {
    return this.client.university.findMany({
      where: {
        isApproved: true,
        NOT: { problemMatches: { some: { problemId } } },
      },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    });
  }
}

export interface RankingOutputForPersistence {
  universityId: string;
  rank: number;
  matchScore: number;
  justification: string;
  evidenceSourceIds: string[];
}

function toKnowledgeRecord(row: KnowledgeRow): SearchableKnowledgeRecord {
  return {
    id: row.id,
    universityId: row.universityId,
    universityName: row.universityName,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    contentText: row.contentText,
    similarity: row.similarity,
    metadata: row.metadata ?? {},
  };
}

function toEvidenceJson(item: SearchableKnowledgeRecord): MatchEvidenceView {
  return {
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    contentText: item.contentText,
    similarity: item.similarity,
    metadata: item.metadata,
  };
}

async function writeStatusTransition(
  transaction: Prisma.TransactionClient,
  problemId: string,
  from: ProblemStatus,
  to: ProblemStatus,
  actorUserId?: string,
): Promise<void> {
  const updated = await transaction.problem.updateMany({
    where: { id: problemId, currentStatus: from },
    data: { currentStatus: to },
  });
  if (updated.count !== 1) {
    throw new AppError(
      "Problem status changed before the matching transition completed",
      409,
      "LIFECYCLE_CONFLICT",
    );
  }
  await transaction.problemStatusHistory.create({
    data: {
      problemId,
      actorUserId: actorUserId ?? null,
      oldStatus: from,
      newStatus: to,
      reason: actorUserId
        ? "Ministry approved university recommendations"
        : "AI generated university recommendations",
      metadata: { source: actorUserId ? "ministry" : "ai_matching" },
    },
  });
}

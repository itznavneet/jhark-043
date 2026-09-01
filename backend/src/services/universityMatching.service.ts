import { MatchingProcessingStatus, ProblemStatus } from "@prisma/client";
import {
  AiProviderUnavailableError,
  MalformedAiOutputError,
} from "../ai/problemAnalysis.errors.js";
import { parseUniversityRankingOutput } from "../ai/universityRanking.schema.js";
import {
  UniversityMatchingRepository,
  type RecommendationRecord,
  type UniversityKnowledgeRecord,
  type RankingOutputForPersistence,
} from "../repositories/university-matching.repository.js";
import type {
  EmbeddingProvider,
  MatchEvidenceView,
  MatchingResultView,
  MatchingRunView,
  RecommendationView,
  SearchableKnowledgeRecord,
  UniversityCandidate,
  UniversityRankingProvider,
} from "../types/matching.js";
import { AppError } from "../utils/appError.js";

const duplicateSimilarityThreshold = 0.78;

export interface UniversityMatchingServiceContract {
  indexKnowledge(universityId?: string): Promise<{ indexedSources: number }>;
  triggerMatching(problemId: string): Promise<MatchingResultView>;
  retryMatching(problemId: string): Promise<MatchingResultView>;
  getRecommendations(problemId: string): Promise<MatchingResultView>;
  findDuplicates(problemId: string): Promise<unknown[]>;
  approveRecommendations(
    problemId: string,
    ministryUserId: string,
    matchIds: string[],
  ): Promise<MatchingResultView>;
  removeRecommendation(
    problemId: string,
    matchId: string,
    ministryUserId: string,
  ): Promise<RecommendationView>;
  addRecommendation(
    problemId: string,
    universityId: string,
  ): Promise<RecommendationView>;
  listAvailableUniversities(problemId: string): Promise<unknown[]>;
}

export class UniversityMatchingService implements UniversityMatchingServiceContract {
  constructor(
    private readonly repository: UniversityMatchingRepositoryContract = new UniversityMatchingRepository(),
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly rankingProvider: UniversityRankingProvider,
  ) {}

  async indexKnowledge(
    universityId?: string,
  ): Promise<{ indexedSources: number }> {
    const universities = universityId
      ? [await this.repository.findApprovedUniversity(universityId)]
      : await this.repository.findApprovedUniversities();
    const selected = universities.filter(
      (item): item is NonNullable<typeof item> => Boolean(item),
    );
    let indexedSources = 0;

    for (const university of selected) {
      for (const source of buildUniversitySources(university)) {
        const embedding = await this.embeddingProvider.createEmbedding(
          source.contentText,
        );
        await this.repository.upsertUniversityEmbedding({
          universityId: university.id,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          contentText: source.contentText,
          embedding: embedding.vector,
          embeddingModel: embedding.modelName,
          dimensions: embedding.dimensions,
          metadata: source.metadata,
        });
        indexedSources += 1;
      }
    }
    return { indexedSources };
  }

  async triggerMatching(problemId: string): Promise<MatchingResultView> {
    return this.runMatching(problemId);
  }

  async retryMatching(problemId: string): Promise<MatchingResultView> {
    const problem = await this.repository.findProblemForMatching(problemId);
    if (!problem) throw problemNotFoundError();
    const latestFailed = await this.repository.findLatestFailedRun(problemId);
    if (!latestFailed) {
      throw new AppError(
        "Matching retry is available only after a failed run",
        409,
        "MATCHING_RETRY_NOT_AVAILABLE",
      );
    }
    return this.runMatching(problemId);
  }

  async getRecommendations(problemId: string): Promise<MatchingResultView> {
    const problem = await this.repository.findProblemForMatching(problemId);
    if (!problem) throw problemNotFoundError();
    const run = await this.repository.findLatestRun(problemId);
    return {
      problemId,
      latestRun: run ? toRunView(run) : null,
      recommendations: run?.matches.map(toRecommendationView) ?? [],
    };
  }

  async findDuplicates(problemId: string): Promise<unknown[]> {
    const problem = await this.repository.findProblemForMatching(problemId);
    if (!problem) throw problemNotFoundError();
    const embedding = await this.getOrCreateProblemEmbedding(problem);
    return (
      await this.repository.findDuplicates(
        problemId,
        embedding.vector,
        embedding.modelName,
      )
    )
      .filter((item) => item.similarity >= duplicateSimilarityThreshold)
      .map((item) => ({
        potentialDuplicate: true,
        existingProblem: {
          id: item.id,
          title: item.title,
          status: item.status,
        },
        similarity: item.similarity,
      }));
  }

  async approveRecommendations(
    problemId: string,
    ministryUserId: string,
    matchIds: string[],
  ): Promise<MatchingResultView> {
    const run = await this.repository.approveRecommendations(
      problemId,
      ministryUserId,
      matchIds,
    );
    return {
      problemId,
      latestRun: toRunView(run),
      recommendations: run.matches.map(toRecommendationView),
    };
  }

  async removeRecommendation(
    problemId: string,
    matchId: string,
    ministryUserId: string,
  ): Promise<RecommendationView> {
    const problem = await this.repository.findProblemForMatching(problemId);
    if (!problem) throw problemNotFoundError();
    if (problem.currentStatus !== ProblemStatus.UNIVERSITIES_RECOMMENDED) {
      throw new AppError(
        "Recommendations can only be changed while awaiting Ministry review",
        409,
        "RECOMMENDATION_REVIEW_NOT_AVAILABLE",
      );
    }
    return toRecommendationView(
      await this.repository.removeRecommendation(
        problemId,
        matchId,
        ministryUserId,
      ),
    );
  }

  async addRecommendation(
    problemId: string,
    universityId: string,
  ): Promise<RecommendationView> {
    const [problem, university, run] = await Promise.all([
      this.repository.findProblemForMatching(problemId),
      this.repository.findApprovedUniversity(universityId),
      this.repository.findLatestCompletedRun(problemId),
    ]);
    if (!problem) throw problemNotFoundError();
    if (!university) {
      throw new AppError(
        "Approved university not found",
        404,
        "UNIVERSITY_NOT_FOUND",
      );
    }
    if (!run) {
      throw new AppError(
        "Run matching before adding a university",
        409,
        "MATCHING_NOT_AVAILABLE",
      );
    }
    if (problem.currentStatus !== ProblemStatus.UNIVERSITIES_RECOMMENDED) {
      throw new AppError(
        "Recommendations can only be changed while awaiting Ministry review",
        409,
        "RECOMMENDATION_REVIEW_NOT_AVAILABLE",
      );
    }

    const embedding = await this.getOrCreateProblemEmbedding(problem);
    const evidence = await this.repository.retrieveKnowledge(
      embedding.vector,
      embedding.modelName,
      20,
      universityId,
    );
    if (evidence.length === 0) {
      throw new AppError(
        "This university has no indexed searchable evidence",
        409,
        "UNIVERSITY_KNOWLEDGE_NOT_INDEXED",
      );
    }
    const candidate: UniversityCandidate = {
      universityId,
      universityName: university.name,
      evidence,
      retrievalScore: evidence[0]?.similarity ?? 0,
    };
    return toRecommendationView(
      await this.repository.addRecommendation(
        problemId,
        universityId,
        run.id,
        {
          universityId,
          rank: 0,
          matchScore: candidate.retrievalScore,
          justification: buildMinistryAddedJustification(candidate),
          evidenceSourceIds: evidence.slice(0, 5).map((item) => item.sourceId),
        },
        candidate,
      ),
    );
  }

  listAvailableUniversities(problemId: string): Promise<unknown[]> {
    return this.repository.listAvailableUniversities(problemId);
  }

  private async runMatching(problemId: string): Promise<MatchingResultView> {
    const problem = await this.repository.findProblemForMatching(problemId);
    if (!problem) throw problemNotFoundError();
    const matchableStatuses: ProblemStatus[] = [
      ProblemStatus.MINISTRY_APPROVED,
      ProblemStatus.AI_UNIVERSITY_MATCHED,
      ProblemStatus.UNIVERSITIES_RECOMMENDED,
    ];
    if (!matchableStatuses.includes(problem.currentStatus)) {
      throw new AppError(
        "Only a Ministry-approved problem can be matched to universities",
        409,
        "MATCHING_REQUIRES_MINISTRY_APPROVAL",
      );
    }

    const run = await this.repository.createMatchingRun({
      problemId,
      embeddingModel: this.embeddingProvider.modelName,
      rankingModel: this.rankingProvider.modelName,
    });
    await this.repository.markRunProcessing(run.id);

    try {
      await this.indexKnowledge();
      const problemEmbedding = await this.getOrCreateProblemEmbedding(problem);
      const knowledge = await this.repository.retrieveKnowledge(
        problemEmbedding.vector,
        problemEmbedding.modelName,
        100,
      );
      const candidates = groupCandidates(knowledge);
      if (candidates.length === 0) {
        throw new AiProviderUnavailableError(
          "No indexed approved university knowledge is available for matching",
        );
      }
      const ranking = parseUniversityRankingOutput(
        await this.rankingProvider.rank(
          buildProblemText(problem),
          candidates.slice(0, 20),
        ),
      );
      const grounded = validateGroundedRankings(ranking.rankings, candidates);
      const completed = await this.repository.completeRun(
        run.id,
        candidates,
        grounded,
      );
      return {
        problemId,
        latestRun: toRunView(completed),
        recommendations: completed.matches.map(toRecommendationView),
      };
    } catch (error) {
      const failureReason = safeFailureReason(error);
      const failed = await this.repository.markRunFailed(run.id, failureReason);
      if (error instanceof AppError) throw error;
      return {
        problemId,
        latestRun: toRunView(failed),
        recommendations: [],
      };
    }
  }

  private async getOrCreateProblemEmbedding(problem: MatchingProblemRecord) {
    const contentText = buildProblemText(problem);
    const embedding = await this.embeddingProvider.createEmbedding(contentText);
    await this.repository.upsertProblemEmbedding({
      problemId: problem.id,
      contentText,
      embedding: embedding.vector,
      embeddingModel: embedding.modelName,
      dimensions: embedding.dimensions,
      metadata: {
        source: "problem_matching",
        category: problem.category?.name ?? null,
      },
    });
    return embedding;
  }
}

export interface UniversityMatchingRepositoryContract {
  findApprovedUniversities: UniversityMatchingRepository["findApprovedUniversities"];
  findApprovedUniversity: UniversityMatchingRepository["findApprovedUniversity"];
  upsertUniversityEmbedding: UniversityMatchingRepository["upsertUniversityEmbedding"];
  upsertProblemEmbedding: UniversityMatchingRepository["upsertProblemEmbedding"];
  retrieveKnowledge: UniversityMatchingRepository["retrieveKnowledge"];
  findDuplicates: UniversityMatchingRepository["findDuplicates"];
  findProblemForMatching: UniversityMatchingRepository["findProblemForMatching"];
  createMatchingRun: UniversityMatchingRepository["createMatchingRun"];
  markRunProcessing: UniversityMatchingRepository["markRunProcessing"];
  markRunFailed: UniversityMatchingRepository["markRunFailed"];
  completeRun: UniversityMatchingRepository["completeRun"];
  findLatestRun: UniversityMatchingRepository["findLatestRun"];
  findLatestCompletedRun: UniversityMatchingRepository["findLatestCompletedRun"];
  findLatestFailedRun: UniversityMatchingRepository["findLatestFailedRun"];
  approveRecommendations: UniversityMatchingRepository["approveRecommendations"];
  removeRecommendation: UniversityMatchingRepository["removeRecommendation"];
  addRecommendation: UniversityMatchingRepository["addRecommendation"];
  listAvailableUniversities: UniversityMatchingRepository["listAvailableUniversities"];
}

type MatchingProblemRecord = NonNullable<
  Awaited<ReturnType<UniversityMatchingRepository["findProblemForMatching"]>>
>;

function buildUniversitySources(university: UniversityKnowledgeRecord) {
  const sources = [
    {
      sourceType: "UNIVERSITY_PROFILE",
      sourceId: university.id,
      contentText: [
        university.name,
        university.shortName,
        university.description,
        university.city,
        university.state,
        university.country,
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: { name: university.name },
    },
    ...university.faculty.map((item) => ({
      sourceType: "FACULTY_PROFILE",
      sourceId: item.id,
      contentText: [
        item.name,
        item.title,
        item.department,
        item.profile,
        item.researchFocus,
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: { name: item.name, department: item.department },
    })),
    ...university.researchAreas.map((item) => ({
      sourceType: "RESEARCH_AREA",
      sourceId: item.id,
      contentText: [item.name, item.description].filter(Boolean).join(" | "),
      metadata: { name: item.name },
    })),
    ...university.labs.map((item) => ({
      sourceType: "LABORATORY",
      sourceId: item.id,
      contentText: [item.name, item.description, ...item.capabilities]
        .filter(Boolean)
        .join(" | "),
      metadata: { name: item.name },
    })),
    ...university.facilities.map((item) => ({
      sourceType: "FACILITY",
      sourceId: item.id,
      contentText: [
        item.name,
        item.type,
        item.description,
        ...item.capabilities,
      ]
        .filter(Boolean)
        .join(" | "),
      metadata: { name: item.name, type: item.type },
    })),
    ...university.previousProjects.map((item) => ({
      sourceType: "PREVIOUS_PROJECT",
      sourceId: item.id,
      contentText: [item.title, item.summary, ...item.domains, item.outcomes]
        .filter(Boolean)
        .join(" | "),
      metadata: { title: item.title, domains: item.domains },
    })),
  ];
  return sources.filter((source) => source.contentText.length > 0);
}

function buildProblemText(problem: MatchingProblemRecord): string {
  const analysis = problem.aiAnalyses[0];
  return [
    problem.title,
    problem.description,
    problem.societalContext,
    problem.category?.name,
    problem.geography,
    problem.district,
    problem.block,
    problem.villageLocality,
    problem.desiredOutcome,
    problem.supportingInformation,
    analysis?.summary,
    ...(analysis?.keywords ?? []),
    ...(analysis?.requiredExpertise ?? []),
    ...(analysis?.requiredFacilities ?? []),
    ...(analysis?.potentialSolutionAreas ?? []),
  ]
    .filter(Boolean)
    .join(" | ");
}

function groupCandidates(
  records: SearchableKnowledgeRecord[],
): UniversityCandidate[] {
  const grouped = new Map<string, UniversityCandidate>();
  for (const record of records) {
    const candidate = grouped.get(record.universityId) ?? {
      universityId: record.universityId,
      universityName: record.universityName,
      evidence: [],
      retrievalScore: record.similarity,
    };
    candidate.evidence.push(record);
    candidate.retrievalScore = Math.max(
      candidate.retrievalScore,
      record.similarity,
    );
    grouped.set(record.universityId, candidate);
  }
  return [...grouped.values()]
    .map((candidate) => ({
      ...candidate,
      evidence: candidate.evidence.slice(0, 8),
    }))
    .sort((left, right) => right.retrievalScore - left.retrievalScore);
}

function validateGroundedRankings(
  rankings: RankingOutputForPersistence[],
  candidates: UniversityCandidate[],
): RankingOutputForPersistence[] {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.universityId, candidate]),
  );
  const seen = new Set<string>();
  const seenRanks = new Set<number>();
  for (const ranking of rankings) {
    const candidate = candidateMap.get(ranking.universityId);
    if (
      !candidate ||
      seen.has(ranking.universityId) ||
      seenRanks.has(ranking.rank)
    ) {
      throw new MalformedAiOutputError(
        "Ranking referenced an invalid or duplicate candidate",
      );
    }
    const sourceIds = new Set(candidate.evidence.map((item) => item.sourceId));
    if (
      ranking.evidenceSourceIds.length === 0 ||
      ranking.evidenceSourceIds.some((sourceId) => !sourceIds.has(sourceId))
    ) {
      throw new MalformedAiOutputError(
        "Ranking referenced evidence not returned by retrieval",
      );
    }
    seen.add(ranking.universityId);
    seenRanks.add(ranking.rank);
  }
  return [...rankings].sort((left, right) => left.rank - right.rank);
}

function buildMinistryAddedJustification(
  candidate: UniversityCandidate,
): string {
  const labels = candidate.evidence
    .slice(0, 3)
    .map(
      (item) =>
        `${item.sourceType.replaceAll("_", " ").toLowerCase()}: ${item.contentText.slice(0, 220)}`,
    )
    .join("; ");
  return `Added by Ministry for review based on retrieved evidence (${labels}).`;
}

function toRunView(run: MatchingRunSummary): MatchingRunView {
  return {
    id: run.id,
    problemId: run.problemId,
    processingStatus: run.processingStatus,
    embeddingModel: run.embeddingModel,
    rankingModel: run.rankingModel,
    candidateCount: run.candidateCount,
    failureReason: run.failureReason,
    generatedAt: run.createdAt.toISOString(),
    processedAt: run.processedAt?.toISOString() ?? null,
  };
}

function toRecommendationView(
  recommendation: RecommendationLike,
): RecommendationView {
  return {
    id: recommendation.id,
    university: recommendation.university,
    rank: recommendation.rank,
    matchScore: recommendation.matchScore.toNumber(),
    decision: recommendation.decision,
    justification: recommendation.justification,
    evidence: (recommendation.evidence as MatchEvidenceView[] | null) ?? [],
    generatedAt: recommendation.generatedAt.toISOString(),
    approvedAt: recommendation.approvedAt?.toISOString() ?? null,
    removedAt: recommendation.removedAt?.toISOString() ?? null,
  };
}

type MatchingRunSummary = {
  id: string;
  problemId: string;
  processingStatus: MatchingProcessingStatus;
  embeddingModel: string;
  rankingModel: string;
  candidateCount: number;
  failureReason: string | null;
  createdAt: Date;
  processedAt: Date | null;
};
type RecommendationLike = RecommendationRecord;

function problemNotFoundError(): AppError {
  return new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
}

function safeFailureReason(error: unknown): string {
  if (
    error instanceof AiProviderUnavailableError ||
    error instanceof MalformedAiOutputError
  ) {
    return error.message;
  }
  return "University matching failed unexpectedly";
}

import {
  AiProcessingStatus,
  AiValidationDecision,
  Prisma,
  type PrismaClient,
  ProblemPriority,
  ProblemStatus,
} from "@prisma/client";
import { database } from "../config/database.js";
import type { ProblemAnalysisOutput, ProblemForAnalysis } from "../types/ai.js";
import { notifyAiAnalysisCompleted } from "../services/notificationEvents.js";
import { notifyProblemLifecycle } from "../services/notificationEvents.js";

const analysisInclude = {
  category: { select: { id: true, name: true } },
} as const;

const analysisProblemSelect = {
  id: true,
  title: true,
  description: true,
  societalContext: true,
  geography: true,
  district: true,
  block: true,
  villageLocality: true,
  desiredOutcome: true,
  supportingInformation: true,
  priority: true,
  category: { select: { name: true } },
  evidence: {
    select: { type: true, title: true, description: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export type ProblemAnalysisRecord = Prisma.ProblemAIAnalysisGetPayload<{
  include: typeof analysisInclude;
}>;

export class ProblemAiRepository {
  constructor(private readonly client: PrismaClient = database) {}

  async findProblemForAnalysis(
    problemId: string,
  ): Promise<ProblemForAnalysis | null> {
    const problem = await this.client.problem.findUnique({
      where: { id: problemId },
      select: analysisProblemSelect,
    });
    if (!problem) return null;

    return {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      societalContext: problem.societalContext,
      location: problem.geography,
      district: problem.district,
      block: problem.block,
      villageLocality: problem.villageLocality,
      desiredOutcome: problem.desiredOutcome,
      supportingInformation: problem.supportingInformation,
      priority: problem.priority,
      category: problem.category?.name ?? null,
      evidence: problem.evidence,
    };
  }

  createPendingAnalysis(
    problemId: string,
    modelName: string,
    promptVersion: string,
  ): Promise<ProblemAnalysisRecord> {
    return this.client.problemAIAnalysis.create({
      data: {
        problemId,
        processingStatus: AiProcessingStatus.PENDING,
        keywords: [],
        requiredExpertise: [],
        requiredFacilities: [],
        potentialSolutionAreas: [],
        modelName,
        promptVersion,
      },
      include: analysisInclude,
    });
  }

  markProcessing(id: string): Promise<ProblemAnalysisRecord> {
    return this.client.problemAIAnalysis.update({
      where: { id },
      data: { processingStatus: AiProcessingStatus.PROCESSING },
      include: analysisInclude,
    });
  }

  async markCompleted(
    id: string,
    output: ProblemAnalysisOutput,
    modelName: string,
    promptVersion: string,
  ): Promise<ProblemAnalysisRecord> {
    const category = await this.client.problemCategory.upsert({
      where: { name: output.category },
      update: {},
      create: { name: output.category },
    });

    const analysis = await this.client.problemAIAnalysis.update({
      where: { id },
      data: {
        category: { connect: { id: category.id } },
        processingStatus: AiProcessingStatus.COMPLETED,
        validationDecision: output.isSocietalProblem
          ? AiValidationDecision.VALIDATED
          : AiValidationDecision.REJECTED_IRRELEVANT,
        isSocietalProblem: output.isSocietalProblem,
        reason: output.reason,
        summary: output.summary,
        keywords: output.keywords,
        requiredExpertise: output.requiredExpertise,
        requiredFacilities: output.requiredFacilities,
        potentialSolutionAreas: output.potentialSolutionAreas,
        priority: output.priority as ProblemPriority | null,
        confidence: output.confidence,
        modelName,
        promptVersion,
        rawResponse: JSON.parse(
          JSON.stringify(output),
        ) as Prisma.InputJsonValue,
        failureReason: null,
        processedAt: new Date(),
      },
      include: analysisInclude,
    });
    await notifyAiAnalysisCompleted(
      this.client,
      analysis.problemId,
      output.isSocietalProblem,
    );
    return analysis;
  }

  async applyValidationStatus(
    problemId: string,
    isSocietalProblem: boolean,
    reason?: string | null,
  ): Promise<void> {
    const nextStatus = isSocietalProblem
      ? ProblemStatus.AI_VALIDATED
      : ProblemStatus.AI_REJECTED;
    await this.client.$transaction(async (transaction) => {
      const updated = await transaction.problem.updateMany({
        where: { id: problemId, currentStatus: ProblemStatus.SUBMITTED },
        data: { currentStatus: nextStatus },
      });
      if (updated.count !== 1) {
        return;
      }
      await transaction.problemStatusHistory.create({
        data: {
          problemId,
          oldStatus: ProblemStatus.SUBMITTED,
          newStatus: nextStatus,
          reason:
            reason ??
            (isSocietalProblem
              ? "AI validated the submission for community support"
              : "AI rejected the submission as outside the societal innovation scope"),
          metadata: { source: "ai_validation" },
        },
      });
      await notifyProblemLifecycle(transaction, problemId, nextStatus);
    });
  }

  async markDuplicateRejected(
    analysisId: string,
    existingProblem: { title: string; similarity: number },
  ): Promise<ProblemAnalysisRecord> {
    return this.client.problemAIAnalysis.update({
      where: { id: analysisId },
      data: {
        validationDecision: AiValidationDecision.REJECTED_DUPLICATE,
        isSocietalProblem: false,
        reason: `This submission substantially matches the existing problem “${existingProblem.title}” (similarity ${existingProblem.similarity.toFixed(2)}). Please review the existing challenge before submitting another post.`,
      },
      include: analysisInclude,
    });
  }

  markFailed(
    id: string,
    failureReason: string,
  ): Promise<ProblemAnalysisRecord> {
    return this.client.problemAIAnalysis.update({
      where: { id },
      data: {
        processingStatus: AiProcessingStatus.FAILED,
        failureReason,
        processedAt: new Date(),
      },
      include: analysisInclude,
    });
  }

  findAnalyses(problemId: string): Promise<ProblemAnalysisRecord[]> {
    return this.client.problemAIAnalysis.findMany({
      where: { problemId },
      orderBy: { createdAt: "desc" },
      include: analysisInclude,
    });
  }
}

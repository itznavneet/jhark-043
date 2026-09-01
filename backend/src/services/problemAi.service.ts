import { AiProcessingStatus } from "@prisma/client";
import { z } from "zod";
import {
  AiProviderUnavailableError,
  MalformedAiOutputError,
} from "../ai/problemAnalysis.errors.js";
import { parseProblemAnalysisOutput } from "../ai/problemAnalysis.schema.js";
import {
  ProblemAiRepository,
  type ProblemAnalysisRecord,
} from "../repositories/problem-ai.repository.js";
import type {
  ProblemAnalysisCollection,
  ProblemAnalysisProvider,
  ProblemAnalysisView,
} from "../types/ai.js";
import { AppError } from "../utils/appError.js";

export interface ProblemAiServiceContract {
  triggerAnalysis(problemId: string): Promise<ProblemAnalysisView>;
  retryAnalysis(problemId: string): Promise<ProblemAnalysisView>;
  getAnalysis(problemId: string): Promise<ProblemAnalysisCollection>;
}

export class ProblemAiService implements ProblemAiServiceContract {
  constructor(
    private readonly repository: ProblemAiRepositoryContract = new ProblemAiRepository(),
    private readonly provider: ProblemAnalysisProvider,
  ) {}

  async triggerAnalysis(problemId: string): Promise<ProblemAnalysisView> {
    return this.runAnalysis(problemId);
  }

  async retryAnalysis(problemId: string): Promise<ProblemAnalysisView> {
    const problem = await this.repository.findProblemForAnalysis(problemId);
    if (!problem) throw problemNotFoundError();
    const analyses = await this.repository.findAnalyses(problemId);
    const latest = analyses[0];
    if (!latest) {
      throw new AppError(
        "There is no failed AI analysis to retry",
        409,
        "AI_RETRY_NOT_AVAILABLE",
      );
    }
    if (latest.processingStatus !== AiProcessingStatus.FAILED) {
      throw new AppError(
        "AI retry is available only after a failed analysis",
        409,
        "AI_RETRY_NOT_AVAILABLE",
      );
    }
    return this.runAnalysis(problemId);
  }

  async getAnalysis(problemId: string): Promise<ProblemAnalysisCollection> {
    const problem = await this.repository.findProblemForAnalysis(problemId);
    if (!problem) throw problemNotFoundError();
    const attempts = (await this.repository.findAnalyses(problemId)).map(
      toAnalysisView,
    );
    return {
      problemId,
      latest: attempts[0] ?? null,
      attempts,
    };
  }

  private async runAnalysis(problemId: string): Promise<ProblemAnalysisView> {
    const problem = await this.repository.findProblemForAnalysis(problemId);
    if (!problem) throw problemNotFoundError();

    const pending = await this.repository.createPendingAnalysis(
      problemId,
      this.provider.modelName,
      this.provider.promptVersion,
    );
    await this.repository.markProcessing(pending.id);

    try {
      const output = parseProblemAnalysisOutput(
        await this.provider.analyze(problem),
      );
      const completed = await this.repository.markCompleted(
        pending.id,
        output,
        this.provider.modelName,
        this.provider.promptVersion,
      );
      return toAnalysisView(completed);
    } catch (error) {
      const failed = await this.repository.markFailed(
        pending.id,
        safeFailureReason(error),
      );
      return toAnalysisView(failed);
    }
  }
}

export interface ProblemAiRepositoryContract {
  findProblemForAnalysis: ProblemAiRepository["findProblemForAnalysis"];
  createPendingAnalysis: ProblemAiRepository["createPendingAnalysis"];
  markProcessing: ProblemAiRepository["markProcessing"];
  markCompleted: ProblemAiRepository["markCompleted"];
  markFailed: ProblemAiRepository["markFailed"];
  findAnalyses: ProblemAiRepository["findAnalyses"];
}

function problemNotFoundError(): AppError {
  return new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
}

function safeFailureReason(error: unknown): string {
  if (error instanceof AiProviderUnavailableError) return error.message;
  if (error instanceof MalformedAiOutputError || error instanceof z.ZodError) {
    return "AI returned malformed structured output";
  }
  return "AI processing failed unexpectedly";
}

function toAnalysisView(record: ProblemAnalysisRecord): ProblemAnalysisView {
  return {
    id: record.id,
    problemId: record.problemId,
    processingStatus: record.processingStatus,
    validationDecision: record.validationDecision,
    isSocietalProblem: record.isSocietalProblem,
    reason: record.reason,
    category: record.category,
    summary: record.summary,
    keywords: record.keywords,
    requiredExpertise: record.requiredExpertise,
    requiredFacilities: record.requiredFacilities,
    potentialSolutionAreas: record.potentialSolutionAreas,
    priority: record.priority,
    confidence: record.confidence?.toNumber() ?? null,
    modelName: record.modelName,
    promptVersion: record.promptVersion,
    failureReason: record.failureReason,
    generatedAt: record.createdAt.toISOString(),
    processedAt: record.processedAt?.toISOString() ?? null,
  };
}

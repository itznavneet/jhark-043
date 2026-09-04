import {
  ProblemRepository,
  type ProblemDetailRecord,
  type ProblemListRecord,
} from "../repositories/problem.repository.js";
import type {
  CreateProblemInput,
  ProblemListQuery,
  ProblemTransitionInput,
} from "../types/problem.js";
import { AppError } from "../utils/appError.js";
import type { ProblemAiServiceContract } from "./problemAi.service.js";

export interface ProblemServiceContract {
  createProblem(userId: string, input: CreateProblemInput): Promise<unknown>;
  listOwnProblems(userId: string, query: ProblemListQuery): Promise<unknown[]>;
  listAllProblems(query: ProblemListQuery): Promise<unknown[]>;
  getOwnProblem(userId: string, problemId: string): Promise<unknown>;
  getMinistryProblem(problemId: string): Promise<unknown>;
  transitionProblem(
    problemId: string,
    ministryUserId: string,
    input: ProblemTransitionInput,
  ): Promise<unknown>;
}

export class ProblemService implements ProblemServiceContract {
  constructor(
    private readonly repository: ProblemRepository = new ProblemRepository(),
    private readonly aiService?: ProblemAiServiceContract,
  ) {}

  async createProblem(
    userId: string,
    input: CreateProblemInput,
  ): Promise<unknown> {
    const problem = await this.repository.createProblem(userId, input);
    if (this.aiService) {
      await this.aiService.processSubmittedProblem(problem.id);
      const updated = await this.repository.findProblemById(problem.id, {
        submitterUserId: userId,
      });
      if (updated) return toProblemDetail(updated);
      throw new AppError(
        "Problem validation completed but the updated submission could not be reloaded",
        500,
        "PROBLEM_VALIDATION_REFRESH_FAILED",
      );
    }
    return toProblemDetail(problem);
  }

  async listOwnProblems(
    userId: string,
    query: ProblemListQuery,
  ): Promise<unknown[]> {
    const problems = await this.repository.listProblems(
      { submitterUserId: userId },
      query,
    );
    return problems.map(toProblemSummary);
  }

  async listAllProblems(query: ProblemListQuery): Promise<unknown[]> {
    const problems = await this.repository.listProblems(
      { ministry: true },
      query,
    );
    return problems.map(toProblemSummary);
  }

  async getOwnProblem(userId: string, problemId: string): Promise<unknown> {
    const problem = await this.repository.findProblemById(problemId, {
      submitterUserId: userId,
    });
    if (!problem) {
      throw problemNotFoundError();
    }
    return toProblemDetail(problem);
  }

  async getMinistryProblem(problemId: string): Promise<unknown> {
    const problem = await this.repository.findProblemById(problemId, {
      ministry: true,
    });
    if (!problem) {
      throw problemNotFoundError();
    }
    return toProblemDetail(problem);
  }

  async transitionProblem(
    problemId: string,
    ministryUserId: string,
    input: ProblemTransitionInput,
  ): Promise<unknown> {
    const problem = await this.repository.transitionProblem(
      problemId,
      ministryUserId,
      "MINISTRY_ADMIN",
      input.newStatus,
      input.reason,
    );
    return toProblemDetail(problem);
  }
}

function problemNotFoundError(): AppError {
  return new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
}

function toProblemSummary(problem: ProblemListRecord) {
  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    category: problem.category,
    location: problem.geography,
    district: problem.district,
    block: problem.block,
    villageLocality: problem.villageLocality,
    priority: problem.priority,
    aiAnalysis: problem.aiAnalyses?.[0]
      ? {
          validationDecision: problem.aiAnalyses[0].validationDecision,
          reason: problem.aiAnalyses[0].reason,
          category: problem.aiAnalyses[0].category,
        }
      : null,
    currentStatus: problem.currentStatus,
    evidenceCount: problem.evidence.length,
    submitter: problem.submitter,
    submittedAt: problem.submittedAt.toISOString(),
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
  };
}

function toProblemDetail(problem: ProblemDetailRecord) {
  return {
    ...toProblemSummary(problem),
    societalContext: problem.societalContext,
    desiredOutcome: problem.desiredOutcome,
    supportingInformation: problem.supportingInformation,
    latitude: decimalToNumber(problem.latitude),
    longitude: decimalToNumber(problem.longitude),
    evidence: problem.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      fileName: item.fileName,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      fileSizeBytes:
        item.fileSizeBytes === null ? null : Number(item.fileSizeBytes),
      externalUrl: item.externalUrl,
      createdAt: item.createdAt.toISOString(),
    })),
    timeline: problem.statusHistory.map((entry) => ({
      id: entry.id,
      previousStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      actor: entry.actor,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

function decimalToNumber(value: { toNumber(): number } | null): number | null {
  return value?.toNumber() ?? null;
}

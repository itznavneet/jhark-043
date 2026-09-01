import {
  AiProcessingStatus,
  AiValidationDecision,
  ProblemPriority,
} from "@prisma/client";
import { describe, expect, it } from "vitest";
import type {
  ProblemAnalysisOutput,
  ProblemAnalysisProvider,
  ProblemForAnalysis,
} from "../types/ai.js";
import type { ProblemAnalysisRecord } from "../repositories/problem-ai.repository.js";
import {
  ProblemAiService,
  type ProblemAiRepositoryContract,
} from "./problemAi.service.js";

const validOutput: ProblemAnalysisOutput = {
  isSocietalProblem: true,
  reason:
    "The challenge affects multiple households and has a public-interest dimension.",
  category: "Water and sanitation",
  summary: "Reliable drinking water is unavailable to several remote villages.",
  keywords: ["drinking water", "rural infrastructure"],
  requiredExpertise: ["water engineering", "community systems"],
  requiredFacilities: ["water quality laboratory"],
  priority: ProblemPriority.HIGH,
  potentialSolutionAreas: [
    "community water monitoring",
    "low-cost purification",
  ],
  confidence: 0.91,
};

const problem: ProblemForAnalysis = {
  id: "problem-1",
  title: "Reliable water for remote villages",
  description: "Several villages depend on unsafe seasonal water sources.",
  societalContext: "The issue affects many households.",
  location: "Jharkhand",
  district: "Ranchi",
  block: "Kanke",
  villageLocality: "Example village",
  desiredOutcome: "Safe and reliable drinking water.",
  supportingInformation: null,
  category: null,
  evidence: [],
};

class InMemoryProblemAiRepository implements ProblemAiRepositoryContract {
  readonly problemStatus = "SUBMITTED";
  readonly analyses: ProblemAnalysisRecord[] = [];

  findProblemForAnalysis(): Promise<ProblemForAnalysis> {
    return Promise.resolve(problem);
  }

  createPendingAnalysis(
    problemId: string,
    modelName: string,
    promptVersion: string,
  ): Promise<ProblemAnalysisRecord> {
    const record = createRecord({ problemId, modelName, promptVersion });
    this.analyses.unshift(record);
    return Promise.resolve(record);
  }

  markProcessing(id: string): Promise<ProblemAnalysisRecord> {
    const record = this.findRecord(id);
    record.processingStatus = AiProcessingStatus.PROCESSING;
    return Promise.resolve(record);
  }

  markCompleted(
    id: string,
    output: ProblemAnalysisOutput,
    modelName: string,
    promptVersion: string,
  ): Promise<ProblemAnalysisRecord> {
    const record = this.findRecord(id);
    Object.assign(record, {
      processingStatus: AiProcessingStatus.COMPLETED,
      validationDecision: output.isSocietalProblem
        ? AiValidationDecision.VALID
        : AiValidationDecision.INVALID,
      isSocietalProblem: output.isSocietalProblem,
      reason: output.reason,
      category: { id: "category-1", name: output.category },
      summary: output.summary,
      keywords: output.keywords,
      requiredExpertise: output.requiredExpertise,
      requiredFacilities: output.requiredFacilities,
      potentialSolutionAreas: output.potentialSolutionAreas,
      priority: output.priority,
      confidence: { toNumber: () => output.confidence ?? 0 },
      modelName,
      promptVersion,
      processedAt: new Date(),
    });
    return Promise.resolve(record);
  }

  markFailed(
    id: string,
    failureReason: string,
  ): Promise<ProblemAnalysisRecord> {
    const record = this.findRecord(id);
    record.processingStatus = AiProcessingStatus.FAILED;
    record.failureReason = failureReason;
    record.processedAt = new Date();
    return Promise.resolve(record);
  }

  findAnalyses(): Promise<ProblemAnalysisRecord[]> {
    return Promise.resolve(this.analyses);
  }

  private findRecord(id: string): ProblemAnalysisRecord {
    const record = this.analyses.find((analysis) => analysis.id === id);
    if (!record) throw new Error("Analysis record not found");
    return record;
  }
}

function createRecord(
  overrides: Partial<ProblemAnalysisRecord> = {},
): ProblemAnalysisRecord {
  return {
    id: `analysis-${Math.random()}`,
    problemId: problem.id,
    processingStatus: AiProcessingStatus.PENDING,
    validationDecision: null,
    isSocietalProblem: null,
    reason: null,
    summary: null,
    keywords: [],
    requiredExpertise: [],
    requiredFacilities: [],
    potentialSolutionAreas: [],
    priority: null,
    confidence: null,
    modelName: null,
    promptVersion: null,
    rawResponse: null,
    failureReason: null,
    processedAt: null,
    createdAt: new Date(),
    category: null,
    ...overrides,
  } as ProblemAnalysisRecord;
}

function providerReturning(value: unknown): ProblemAnalysisProvider {
  return {
    modelName: "mock-model",
    promptVersion: "mock-prompt-v1",
    analyze: async () => value,
  };
}

describe("ProblemAiService", () => {
  it("persists valid analysis without changing Ministry lifecycle status", async () => {
    const repository = new InMemoryProblemAiRepository();
    const service = new ProblemAiService(
      repository,
      providerReturning(validOutput),
    );

    const result = await service.triggerAnalysis(problem.id);

    expect(result.processingStatus).toBe(AiProcessingStatus.COMPLETED);
    expect(result.validationDecision).toBe(AiValidationDecision.VALID);
    expect(result.category?.name).toBe("Water and sanitation");
    expect(result.requiredExpertise).toContain("water engineering");
    expect(repository.problemStatus).toBe("SUBMITTED");
  });

  it("classifies a structured invalid/personal response without approving it", async () => {
    const repository = new InMemoryProblemAiRepository();
    const service = new ProblemAiService(
      repository,
      providerReturning({
        ...validOutput,
        isSocietalProblem: false,
        reason:
          "This is a private family dispute with no broader societal dimension.",
      }),
    );

    const result = await service.triggerAnalysis(problem.id);

    expect(result.processingStatus).toBe(AiProcessingStatus.COMPLETED);
    expect(result.validationDecision).toBe(AiValidationDecision.INVALID);
    expect(result.isSocietalProblem).toBe(false);
  });

  it("records malformed output and provider failures as retryable failures", async () => {
    const malformedRepository = new InMemoryProblemAiRepository();
    const malformedService = new ProblemAiService(
      malformedRepository,
      providerReturning({ isSocietalProblem: "yes" }),
    );
    const malformed = await malformedService.triggerAnalysis(problem.id);
    expect(malformed.processingStatus).toBe(AiProcessingStatus.FAILED);
    expect(malformed.failureReason).toContain("malformed");

    const failureRepository = new InMemoryProblemAiRepository();
    const failingProvider: ProblemAnalysisProvider = {
      modelName: "mock-model",
      promptVersion: "mock-prompt-v1",
      analyze: async () => {
        throw new Error("simulated provider outage");
      },
    };
    const failureService = new ProblemAiService(
      failureRepository,
      failingProvider,
    );
    const failed = await failureService.triggerAnalysis(problem.id);
    expect(failed.processingStatus).toBe(AiProcessingStatus.FAILED);
    expect(failed.failureReason).toBe("AI processing failed unexpectedly");
  });

  it("retries the latest failed attempt and persists the successful retry", async () => {
    const repository = new InMemoryProblemAiRepository();
    let calls = 0;
    const provider: ProblemAnalysisProvider = {
      modelName: "mock-model",
      promptVersion: "mock-prompt-v1",
      analyze: async () => {
        calls += 1;
        if (calls === 1) throw new Error("temporary outage");
        return validOutput;
      },
    };
    const service = new ProblemAiService(repository, provider);

    await service.triggerAnalysis(problem.id);
    const retry = await service.retryAnalysis(problem.id);

    expect(retry.processingStatus).toBe(AiProcessingStatus.COMPLETED);
    expect(repository.analyses).toHaveLength(2);
    expect(
      (await service.getAnalysis(problem.id)).latest?.processingStatus,
    ).toBe(AiProcessingStatus.COMPLETED);
  });
});

import type {
  AiProcessingStatus,
  AiValidationDecision,
  ProblemPriority,
} from "@prisma/client";

export interface ProblemForAnalysis {
  id: string;
  title: string;
  description: string;
  societalContext: string | null;
  location: string | null;
  district: string | null;
  block: string | null;
  villageLocality: string | null;
  desiredOutcome: string | null;
  supportingInformation: string | null;
  priority: ProblemPriority | null;
  category: string | null;
  evidence: Array<{
    type: string;
    title: string;
    description: string | null;
  }>;
}

export interface ProblemAnalysisOutput {
  isSocietalProblem: boolean;
  reason: string;
  category: string;
  summary: string;
  keywords: string[];
  requiredExpertise: string[];
  requiredFacilities: string[];
  priority: ProblemPriority | null;
  potentialSolutionAreas: string[];
  confidence: number | null;
}

export interface ProblemAnalysisProvider {
  analyze(problem: ProblemForAnalysis): Promise<unknown>;
  modelName: string;
  promptVersion: string;
}

export interface ProblemAnalysisView {
  id: string;
  problemId: string;
  processingStatus: AiProcessingStatus;
  validationDecision: AiValidationDecision | null;
  isSocietalProblem: boolean | null;
  reason: string | null;
  category: { id: string; name: string } | null;
  summary: string | null;
  keywords: string[];
  requiredExpertise: string[];
  requiredFacilities: string[];
  potentialSolutionAreas: string[];
  priority: ProblemPriority | null;
  confidence: number | null;
  modelName: string | null;
  promptVersion: string | null;
  failureReason: string | null;
  generatedAt: string;
  processedAt: string | null;
}

export interface ProblemAnalysisCollection {
  problemId: string;
  latest: ProblemAnalysisView | null;
  attempts: ProblemAnalysisView[];
}

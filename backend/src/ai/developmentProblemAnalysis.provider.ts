import type {
  ProblemAnalysisProvider,
  ProblemForAnalysis,
} from "../types/ai.js";

const privateProblemSignals = [
  "family dispute",
  "family problem",
  "my wife",
  "my husband",
  "my marriage",
  "personal loan",
  "personal request",
  "my neighbor",
  "my neighbour",
];

export class DevelopmentProblemAnalysisProvider implements ProblemAnalysisProvider {
  readonly modelName = "development-societal-problem-heuristic";
  readonly promptVersion = "development-problem-analysis-v1";

  async analyze(problem: ProblemForAnalysis) {
    const text =
      `${problem.title} ${problem.description} ${problem.societalContext ?? ""}`.toLowerCase();
    const isSocietalProblem =
      text.trim().length >= 70 &&
      !privateProblemSignals.some((signal) => text.includes(signal));

    return {
      isSocietalProblem,
      reason: isSocietalProblem
        ? "The submission contains a substantive challenge that can affect a community or institution and is suitable for further public-interest review."
        : "The submission appears personal, private, too brief, or outside the societal innovation scope. Please provide a clear community or institutional challenge.",
      category: problem.category ?? "General societal innovation",
      summary: problem.description.slice(0, 500),
      keywords: [problem.category ?? "societal innovation"],
      requiredExpertise: [],
      requiredFacilities: [],
      priority: null,
      potentialSolutionAreas: [],
      confidence: isSocietalProblem ? 0.7 : 0.9,
    };
  }
}

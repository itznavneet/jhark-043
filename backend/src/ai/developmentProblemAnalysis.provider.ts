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
  "my friend",
  "teasing me",
  "not talking to me",
  "my family",
  "friend keeps",
];

export class DevelopmentProblemAnalysisProvider implements ProblemAnalysisProvider {
  readonly modelName = "development-societal-problem-heuristic";
  readonly promptVersion = "development-problem-analysis-v2";

  async analyze(problem: ProblemForAnalysis) {
    const description = problem.description.trim().toLowerCase();
    const text = [
      problem.title,
      problem.description,
      problem.category,
      problem.location,
      problem.district,
      problem.block,
      problem.villageLocality,
      problem.societalContext,
      problem.desiredOutcome,
      problem.supportingInformation,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const isSocietalProblem =
      description.length >= 50 &&
      !privateProblemSignals.some((signal) => text.includes(signal));

    return {
      isSocietalProblem,
      reason: isSocietalProblem
        ? "The submission contains a substantive challenge that can affect a community or institution and is suitable for further public-interest review."
        : "The submission appears personal, private, too brief, or outside the societal innovation scope. Please provide a clear community or institutional challenge in the description.",
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

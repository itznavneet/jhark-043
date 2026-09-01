import OpenAI from "openai";
import type { AppEnvironment } from "../config/environment.js";
import type {
  ProblemAnalysisProvider,
  ProblemForAnalysis,
} from "../types/ai.js";
import {
  parseProblemAnalysisOutput,
  problemAnalysisJsonSchema,
} from "./problemAnalysis.schema.js";
import {
  buildProblemAnalysisUserPrompt,
  problemAnalysisPromptVersion,
  problemAnalysisSystemPrompt,
} from "./problemAnalysis.prompt.js";
import {
  AiProviderUnavailableError,
  MalformedAiOutputError,
} from "./problemAnalysis.errors.js";

export class OpenAiProblemAnalysisProvider implements ProblemAnalysisProvider {
  readonly modelName: string;
  readonly promptVersion = problemAnalysisPromptVersion;
  private readonly client: OpenAI | null;

  constructor(environment: AppEnvironment) {
    this.modelName = environment.openAiModel;
    this.client = environment.openAiApiKey
      ? new OpenAI({
          apiKey: environment.openAiApiKey,
          timeout: 30_000,
          maxRetries: 1,
        })
      : null;
  }

  async analyze(problem: ProblemForAnalysis): Promise<unknown> {
    if (!this.client) {
      throw new AiProviderUnavailableError(
        "OPENAI_API_KEY is not configured for AI processing",
      );
    }

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model: this.modelName,
        temperature: 0,
        messages: [
          { role: "system", content: problemAnalysisSystemPrompt },
          { role: "user", content: buildProblemAnalysisUserPrompt(problem) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "societal_problem_analysis",
            strict: true,
            schema: problemAnalysisJsonSchema,
          },
        },
      });
    } catch {
      throw new AiProviderUnavailableError(
        "OpenAI could not process the problem analysis request",
      );
    }

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new MalformedAiOutputError();
    }

    try {
      return parseProblemAnalysisOutput(JSON.parse(content));
    } catch {
      throw new MalformedAiOutputError();
    }
  }
}

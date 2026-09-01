import OpenAI from "openai";
import type { AppEnvironment } from "../config/environment.js";
import type {
  UniversityCandidate,
  UniversityRankingProvider,
} from "../types/matching.js";
import {
  AiProviderUnavailableError,
  MalformedAiOutputError,
} from "./problemAnalysis.errors.js";
import {
  buildUniversityRankingUserPrompt,
  universityRankingPromptVersion,
  universityRankingSystemPrompt,
} from "./universityRanking.prompt.js";
import {
  parseUniversityRankingOutput,
  universityRankingJsonSchema,
} from "./universityRanking.schema.js";

export class OpenAiUniversityRankingProvider implements UniversityRankingProvider {
  readonly modelName: string;
  readonly promptVersion = universityRankingPromptVersion;
  private readonly client: OpenAI | null;

  constructor(environment: AppEnvironment) {
    this.modelName = environment.matchingRankingModel;
    this.client = environment.openAiApiKey
      ? new OpenAI({
          apiKey: environment.openAiApiKey,
          timeout: 30_000,
          maxRetries: 1,
        })
      : null;
  }

  async rank(problemText: string, candidates: UniversityCandidate[]) {
    if (!this.client) {
      throw new AiProviderUnavailableError(
        "OPENAI_API_KEY is not configured for university ranking",
      );
    }

    let completion;
    try {
      completion = await this.client.chat.completions.create({
        model: this.modelName,
        temperature: 0,
        messages: [
          { role: "system", content: universityRankingSystemPrompt },
          {
            role: "user",
            content: buildUniversityRankingUserPrompt(problemText, candidates),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "university_recommendation_ranking",
            strict: true,
            schema: universityRankingJsonSchema,
          },
        },
      });
    } catch {
      throw new AiProviderUnavailableError(
        "OpenAI could not rank university matching candidates",
      );
    }

    const content = completion.choices[0]?.message.content;
    if (!content) throw new MalformedAiOutputError();
    try {
      return parseUniversityRankingOutput(JSON.parse(content));
    } catch {
      throw new MalformedAiOutputError();
    }
  }
}

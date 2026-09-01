import { z } from "zod";
import type { RankingOutput } from "../types/matching.js";

export const universityRankingOutputSchema = z
  .object({
    rankings: z
      .array(
        z
          .object({
            universityId: z.uuid(),
            rank: z.number().int().min(1).max(5),
            matchScore: z.number().min(0).max(1),
            justification: z.string().trim().min(1).max(3000),
            evidenceSourceIds: z.array(z.uuid()).min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict();

export function parseUniversityRankingOutput(value: unknown): RankingOutput {
  return universityRankingOutputSchema.parse(value);
}

export const universityRankingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rankings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          universityId: { type: "string" },
          rank: { type: "integer" },
          matchScore: { type: "number" },
          justification: { type: "string" },
          evidenceSourceIds: { type: "array", items: { type: "string" } },
        },
        required: [
          "universityId",
          "rank",
          "matchScore",
          "justification",
          "evidenceSourceIds",
        ],
      },
    },
  },
  required: ["rankings"],
} as const;

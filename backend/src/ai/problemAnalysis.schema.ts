import { z } from "zod";
import type { ProblemAnalysisOutput } from "../types/ai.js";

export const problemAnalysisOutputSchema = z
  .object({
    isSocietalProblem: z.boolean(),
    reason: z.string().trim().min(1).max(5_000),
    category: z.string().trim().min(2).max(120),
    summary: z.string().trim().min(1).max(2_000),
    keywords: z.array(z.string().trim().min(1).max(120)).max(30),
    requiredExpertise: z.array(z.string().trim().min(1).max(160)).max(30),
    requiredFacilities: z.array(z.string().trim().min(1).max(160)).max(30),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).nullable(),
    potentialSolutionAreas: z.array(z.string().trim().min(1).max(200)).max(20),
    confidence: z.number().min(0).max(1).nullable(),
  })
  .strict();

export type ValidatedProblemAnalysisOutput = z.infer<
  typeof problemAnalysisOutputSchema
>;

export function parseProblemAnalysisOutput(
  value: unknown,
): ProblemAnalysisOutput {
  return problemAnalysisOutputSchema.parse(value);
}

export const problemAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isSocietalProblem: { type: "boolean" },
    reason: { type: "string" },
    category: { type: "string" },
    summary: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    requiredExpertise: { type: "array", items: { type: "string" } },
    requiredFacilities: { type: "array", items: { type: "string" } },
    priority: {
      type: ["string", "null"],
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL", null],
    },
    potentialSolutionAreas: { type: "array", items: { type: "string" } },
    confidence: { type: ["number", "null"] },
  },
  required: [
    "isSocietalProblem",
    "reason",
    "category",
    "summary",
    "keywords",
    "requiredExpertise",
    "requiredFacilities",
    "priority",
    "potentialSolutionAreas",
    "confidence",
  ],
} as const;

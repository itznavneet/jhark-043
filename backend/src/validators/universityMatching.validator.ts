import { z } from "zod";
import { problemIdParamsSchema } from "./problem.validator.js";

export const matchingProblemParamsSchema = problemIdParamsSchema;

export const matchingRecommendationParamsSchema = z.object({
  problemId: z.uuid(),
  matchId: z.uuid(),
});

export const addRecommendationParamsSchema = z.object({
  problemId: z.uuid(),
  universityId: z.uuid(),
});

export const indexKnowledgeQuerySchema = z.object({
  universityId: z.uuid().optional(),
});

export const approveRecommendationsSchema = z.object({
  matchIds: z.array(z.uuid()).min(1).max(5),
});

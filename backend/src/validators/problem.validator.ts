import { z } from "zod";
import { problemStatuses } from "../domain/lifecycle.js";

const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();

export const problemEvidenceSchema = z
  .object({
    type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
    title: z.string().trim().min(1).max(255),
    description: optionalText(5000),
    fileName: optionalText(255),
    storageKey: optionalText(500),
    mimeType: optionalText(120),
    fileSizeBytes: z.number().int().nonnegative().max(50_000_000).optional(),
    externalUrl: z.url().max(1000).optional(),
  })
  .refine(
    (evidence) =>
      Boolean(evidence.storageKey) !== Boolean(evidence.externalUrl),
    {
      message: "Evidence must include exactly one storage key or external URL",
      path: ["externalUrl"],
    },
  );

export const createProblemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Problem title is required.")
    .min(5, "Problem title must contain at least 5 characters.")
    .max(255, "Problem title must be 255 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Problem description is required.")
    .min(50, "Description must contain at least 50 characters.")
    .max(20_000, "Problem description must be 20,000 characters or fewer."),
  category: z
    .string()
    .trim()
    .min(1, "Problem category is required.")
    .min(2, "Problem category must contain at least 2 characters.")
    .max(120, "Problem category must be 120 characters or fewer."),
  societalContext: optionalText(10_000),
  location: optionalText(255),
  district: optionalText(160),
  block: optionalText(160),
  villageLocality: optionalText(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  desiredOutcome: optionalText(10_000),
  supportingInformation: optionalText(20_000),
  evidence: z.array(problemEvidenceSchema).max(20).default([]),
});

export const problemListQuerySchema = z.object({
  status: z.enum(problemStatuses).optional(),
  category: optionalText(120),
  district: optionalText(160),
  block: optionalText(160),
});

export const problemIdParamsSchema = z.object({
  problemId: z.uuid(),
});

export const problemTransitionSchema = z.object({
  newStatus: z.enum(problemStatuses),
  reason: optionalText(5000),
});

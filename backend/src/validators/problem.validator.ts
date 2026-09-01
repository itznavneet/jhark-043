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
  .refine((evidence) => evidence.storageKey || evidence.externalUrl, {
    message: "Evidence must include a storage key or external URL",
    path: ["externalUrl"],
  });

export const createProblemSchema = z.object({
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().min(20).max(20_000),
  category: z.string().trim().min(2).max(120),
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

import { z } from "zod";
import { projectStatuses } from "../domain/projectLifecycle.js";

const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();
const documentTypes = [
  "TECHNICAL_DOCUMENT",
  "PROTOTYPE_ARTIFACT",
  "TEST_REPORT",
  "PILOT_REPORT",
  "IMPLEMENTATION_PLAN",
  "IMPACT_EVIDENCE",
  "OTHER",
] as const;

const documentSchema = z
  .object({
    type: z.enum(documentTypes),
    title: z.string().trim().min(1).max(255),
    storageKey: optionalText(500),
    externalUrl: z.url().max(1000).optional(),
    mimeType: optionalText(120),
    fileSizeBytes: z.number().int().nonnegative().max(100_000_000).optional(),
  })
  .refine((value) => Boolean(value.storageKey) !== Boolean(value.externalUrl), {
    message: "Provide exactly one storage key or external URL",
    path: ["externalUrl"],
  });

export const projectIdParamsSchema = z.object({ projectId: z.uuid() });
export const projectMilestoneIdParamsSchema = projectIdParamsSchema.extend({
  milestoneId: z.uuid(),
});

export const projectTransitionSchema = z.object({
  status: z.enum(projectStatuses),
  reason: optionalText(5000),
});

export const projectMilestoneSchema = z.object({
  title: z.string().trim().min(2).max(255),
  description: optionalText(5000),
  dueDate: z.iso.datetime().optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const)
    .optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  deliverables: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
});

export const projectUpdateSchema = z.object({
  title: z.string().trim().min(2).max(255),
  description: z.string().trim().min(2).max(20_000),
  progressPercentage: z.number().int().min(0).max(100).optional(),
  milestoneId: z.uuid().optional(),
  date: z.iso.datetime().optional(),
  documents: z.array(documentSchema).max(20).optional(),
});

export const projectDocumentSchema = documentSchema;

export const impactMeasurementSchema = z.object({
  metricName: z.string().trim().min(1).max(255),
  description: optionalText(5000),
  baseline: z.number().finite().optional(),
  target: z.number().finite().optional(),
  currentValue: z.number().finite().optional(),
  peopleBenefited: z.number().int().nonnegative().optional(),
  locationsCovered: z.number().int().nonnegative().optional(),
  unit: optionalText(80),
  measuredAt: z.iso.datetime().optional(),
  evidence: optionalText(20_000),
  notes: optionalText(10_000),
});

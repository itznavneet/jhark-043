import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(320)
  .optional();

const industrySupportTypes = [
  "FUNDING",
  "MENTORSHIP",
  "TECHNICAL_SUPPORT",
  "INFRASTRUCTURE",
  "PILOT_SUPPORT",
  "OTHER",
] as const;

export const assignmentIdParamsSchema = z.object({
  assignmentId: z.uuid(),
});

export const collaborationProblemIdParamsSchema = z.object({
  problemId: z.uuid(),
});

export const sendInvitationsSchema = z.object({
  matchIds: z
    .array(z.uuid())
    .min(1)
    .max(5)
    .refine(
      (matchIds) => new Set(matchIds).size === matchIds.length,
      "matchIds must not contain duplicates",
    ),
});

export const rejectAssignmentSchema = z.object({
  reason: optionalText(5000),
});

const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(160),
  memberType: z.enum(["RESEARCH_STUDENT", "OTHER"]),
  roleTitle: optionalText(160),
  department: optionalText(160),
  email: optionalEmail,
  userId: z.uuid().optional(),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: optionalText(5000),
  facultyMentor: z.object({
    name: z.string().trim().min(1).max(160),
    roleTitle: optionalText(160),
    department: optionalText(160),
    email: optionalEmail,
    userId: z.uuid().optional(),
  }),
  members: z.array(teamMemberSchema).min(1).max(100),
});

export const proposalDraftSchema = z.object({
  title: z.string().trim().min(3).max(255),
  problemUnderstanding: z.string().trim().min(20).max(20_000),
  solutionSummary: z.string().trim().min(20).max(20_000),
  technicalApproach: optionalText(20_000),
  innovation: optionalText(20_000),
  expectedOutcomes: optionalText(20_000),
  requiredResources: optionalText(20_000),
  estimatedBudget: z
    .number()
    .finite()
    .nonnegative()
    .max(1_000_000_000_000)
    .optional(),
  timeline: optionalText(10_000),
  prototypePlan: optionalText(20_000),
  pilotPlan: optionalText(20_000),
  implementationPlan: optionalText(20_000),
  expectedSocialImpact: optionalText(20_000),
  requestedSupport: optionalText(20_000),
  requestedSupportTypes: z
    .array(z.enum(industrySupportTypes))
    .max(industrySupportTypes.length)
    .optional(),
});

export const industryProposalIdParamsSchema = z.object({
  proposalId: z.uuid(),
});

export const industryInterestIdParamsSchema = z.object({
  interestId: z.uuid(),
});

export const industryProposalQuerySchema = z.object({
  domain: optionalText(160),
  technology: optionalText(160),
  universityId: z.uuid().optional(),
  requiredExpertise: optionalText(160),
  minBudget: z.coerce.number().finite().nonnegative().optional(),
  maxBudget: z.coerce.number().finite().nonnegative().optional(),
  supportType: z.enum(industrySupportTypes).optional(),
});

export const expressIndustryInterestSchema = z.object({
  message: optionalText(5000),
  supportType: z.enum(industrySupportTypes),
});

const fundingSchema = z.object({
  fundingType: z
    .enum([
      "FINANCIAL",
      "CSR_GRANT",
      "EQUIPMENT",
      "IN_KIND",
      "EXPERTISE",
      "OTHER",
    ])
    .default("FINANCIAL"),
  amount: z.number().finite().nonnegative().optional(),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  conditionsNotes: optionalText(5000),
  status: z
    .enum([
      "PROPOSED",
      "COMMITTED",
      "PARTIALLY_RECEIVED",
      "RECEIVED",
      "CANCELLED",
    ])
    .default("PROPOSED"),
});

export const acceptIndustryInterestSchema = z.object({
  supportType: z.enum(industrySupportTypes),
  supportSummary: optionalText(5000),
  funding: fundingSchema.optional(),
});

export type SendInvitationsRequest = z.infer<typeof sendInvitationsSchema>;
export type RejectAssignmentRequest = z.infer<typeof rejectAssignmentSchema>;
export type TeamRequest = z.infer<typeof teamSchema>;
export type ProposalDraftRequest = z.infer<typeof proposalDraftSchema>;
export type IndustryProposalQuery = z.infer<typeof industryProposalQuerySchema>;
export type ExpressIndustryInterestRequest = z.infer<
  typeof expressIndustryInterestSchema
>;
export type AcceptIndustryInterestRequest = z.infer<
  typeof acceptIndustryInterestSchema
>;

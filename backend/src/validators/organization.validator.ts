import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(320, "Email address must be 320 characters or fewer.");

const facultySchema = z.object({
  name: z.string().trim().min(1).max(160),
  title: optionalText(160),
  department: optionalText(160),
  profile: optionalText(5000),
  researchFocus: optionalText(5000),
  email,
});

const researchAreaSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: optionalText(5000),
});

const labSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalText(5000),
  capabilities: z.array(z.string().trim().min(1).max(160)).max(50),
});

const facilitySchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.enum([
    "INNOVATION_CENTER",
    "INCUBATION_FACILITY",
    "TESTING_FACILITY",
    "FIELD_SITE",
    "OTHER",
  ]),
  description: optionalText(5000),
  capabilities: z.array(z.string().trim().min(1).max(160)).max(50),
});

const previousProjectSchema = z.object({
  title: z.string().trim().min(1).max(255),
  summary: optionalText(5000),
  domains: z.array(z.string().trim().min(1).max(160)).max(50),
  outcomes: optionalText(5000),
  completedAt: z.iso.datetime().optional(),
});

const expertiseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: optionalText(5000),
});

const organizationBaseSchema = z.object({
  name: z.string().trim().min(2).max(255),
  registrationNumber: optionalText(120),
  phone: optionalText(40),
  address: optionalText(500),
  description: optionalText(10_000),
  website: z.url().max(500).optional(),
  city: optionalText(120),
  district: optionalText(160),
  state: optionalText(120),
  country: z.string().trim().min(2).max(120).default("India"),
});

export const universityDetailsSchema = organizationBaseSchema.extend({
  shortName: optionalText(80),
  departments: z.array(z.string().trim().min(1).max(160)).max(100).default([]),
  capabilities: z.array(z.string().trim().min(1).max(160)).max(100).default([]),
  applicationContact: optionalText(160),
  faculty: z.array(facultySchema).max(500).default([]),
  researchAreas: z.array(researchAreaSchema).max(200).default([]),
  labs: z.array(labSchema).max(200).default([]),
  facilities: z.array(facilitySchema).max(200).default([]),
  previousProjects: z.array(previousProjectSchema).max(500).default([]),
});

export const industryDetailsSchema = organizationBaseSchema.extend({
  organizationType: optionalText(120),
  technologyAreas: z
    .array(z.string().trim().min(1).max(160))
    .max(100)
    .default([]),
  fundingCapability: optionalText(1000),
  technicalSupportCapability: optionalText(1000),
  fieldDeploymentCapability: optionalText(1000),
  contactPerson: optionalText(160),
  sector: optionalText(160),
  expertise: z.array(expertiseSchema).max(200).default([]),
  interestAreas: z
    .array(z.string().trim().min(1).max(160))
    .max(200)
    .default([]),
  supportCapabilities: z.array(expertiseSchema).max(200).default([]),
});

export const ministryCreateOrganizationSchema = z.discriminatedUnion(
  "targetType",
  [
    z.object({
      targetType: z.literal("UNIVERSITY"),
      email,
      displayName: z.string().trim().min(2).max(160),
      organization: universityDetailsSchema,
    }),
    z.object({
      targetType: z.literal("INDUSTRY"),
      email,
      displayName: z.string().trim().min(2).max(160),
      organization: industryDetailsSchema,
    }),
  ],
);

export const registrationApplicationSchema = z.discriminatedUnion(
  "targetType",
  [
    z.object({
      targetType: z.literal("UNIVERSITY"),
      organization: universityDetailsSchema,
    }),
    z.object({
      targetType: z.literal("INDUSTRY"),
      organization: industryDetailsSchema,
    }),
  ],
);

export const publicRegistrationApplicationSchema = z.discriminatedUnion(
  "targetType",
  [
    z.object({
      targetType: z.literal("UNIVERSITY"),
      applicant: z
        .object({
          email,
          displayName: z.string().trim().min(2).max(160),
          password: z
            .string()
            .min(12, "Password must contain at least 12 characters.")
            .max(200),
          confirmPassword: z.string().min(1).max(200),
        })
        .refine((input) => input.password === input.confirmPassword, {
          path: ["confirmPassword"],
          message: "Passwords do not match",
        }),
      organization: universityDetailsSchema,
    }),
    z.object({
      targetType: z.literal("INDUSTRY"),
      applicant: z
        .object({
          email,
          displayName: z.string().trim().min(2).max(160),
          password: z
            .string()
            .min(12, "Password must contain at least 12 characters.")
            .max(200),
          confirmPassword: z.string().min(1).max(200),
        })
        .refine((input) => input.password === input.confirmPassword, {
          path: ["confirmPassword"],
          message: "Passwords do not match",
        }),
      organization: industryDetailsSchema,
    }),
  ],
);

export const registrationListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const registrationApplicationIdParamsSchema = z.object({
  applicationId: z.uuid(),
});

export const rejectionSchema = z.object({
  reason: z.string().trim().min(3).max(5000),
});

export const universityProfileSchema = universityDetailsSchema;
export const industryProfileSchema = industryDetailsSchema;

export type MinistryCreateOrganizationInput = z.infer<
  typeof ministryCreateOrganizationSchema
>;
export type RegistrationApplicationInput = z.infer<
  typeof registrationApplicationSchema
>;
export type PublicRegistrationApplicationInput = z.infer<
  typeof publicRegistrationApplicationSchema
>;

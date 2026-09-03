import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(320, "Email address must be 320 characters or fewer."),
  password: z.string().min(1, "Password is required.").max(128),
  accountType: z.enum([
    "MINISTRY_ADMIN",
    "SUBMITTER",
    "UNIVERSITY",
    "INDUSTRY",
  ]),
});

export const submitterRegistrationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address.")
      .max(320, "Email address must be 320 characters or fewer."),
    password: z
      .string()
      .min(12, "Password must contain at least 12 characters.")
      .max(200),
    confirmPassword: z.string().min(1).max(200),
    displayName: z.string().trim().min(2).max(160),
    submitterType: z.enum([
      "INDIVIDUAL_CITIZEN",
      "CITIZEN",
      "PANCHAYATI_RAJ",
      "ORGANIZATION",
    ]),
    organizationName: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
  })
  .refine((input) => input.currentPassword !== input.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password",
  });

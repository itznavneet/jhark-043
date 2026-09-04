import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  RegistrationStatus,
  RegistrationTargetType,
  UserRole,
} from "@prisma/client";
import {
  OrganizationRepository,
  type RegistrationApplicationRecord,
} from "../repositories/organization.repository.js";
import type {
  CreatedOrganizationAccountResponse,
  OrganizationApplicationResponse,
} from "../types/organization.js";
import {
  industryDetailsSchema,
  type MinistryCreateOrganizationInput,
  type RegistrationApplicationInput,
  type PublicRegistrationApplicationInput,
  universityDetailsSchema,
} from "../validators/organization.validator.js";
import { toPublicUser } from "./auth.service.js";
import { AppError } from "../utils/appError.js";

export interface RegistrationServiceContract {
  createOrganizationAccount(
    ministryUserId: string,
    input: MinistryCreateOrganizationInput,
  ): Promise<CreatedOrganizationAccountResponse>;
  submitApplication(
    applicantUserId: string,
    applicantRole: UserRole,
    input: RegistrationApplicationInput,
  ): Promise<OrganizationApplicationResponse>;
  submitPublicApplication(
    input: PublicRegistrationApplicationInput,
  ): Promise<OrganizationApplicationResponse>;
  listApplications(
    status?: RegistrationStatus,
  ): Promise<OrganizationApplicationResponse[]>;
  getApplication(
    applicationId: string,
  ): Promise<OrganizationApplicationResponse>;
  approveApplication(
    applicationId: string,
    ministryUserId: string,
  ): Promise<OrganizationApplicationResponse>;
  rejectApplication(
    applicationId: string,
    ministryUserId: string,
    reason: string,
  ): Promise<OrganizationApplicationResponse>;
}

export class RegistrationService implements RegistrationServiceContract {
  constructor(
    private readonly repository: OrganizationRepository = new OrganizationRepository(),
  ) {}

  async createOrganizationAccount(
    ministryUserId: string,
    input: MinistryCreateOrganizationInput,
  ): Promise<CreatedOrganizationAccountResponse> {
    await this.ensureEmailAvailable(input.email);
    await this.ensureOrganizationAvailable(
      input.organization.name,
      input.organization.registrationNumber,
    );
    const temporaryPassword = randomBytes(18).toString("base64url");
    const result = await this.repository.createOrganizationAccount({
      ministryUserId,
      targetType: input.targetType,
      email: input.email,
      displayName: input.displayName,
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      organization: input.organization,
    });

    return {
      targetType: input.targetType,
      organizationId: result.organizationId,
      user: toPublicUser(result.user),
      initialCredentials: {
        email: input.email,
        temporaryPassword,
      },
    };
  }

  async submitApplication(
    applicantUserId: string,
    applicantRole: UserRole,
    input: RegistrationApplicationInput,
  ): Promise<OrganizationApplicationResponse> {
    const expectedRole = roleForTarget(input.targetType);
    if (applicantRole !== expectedRole) {
      throw new AppError(
        "Your role cannot submit this registration application",
        403,
        "REGISTRATION_ROLE_MISMATCH",
      );
    }

    const existingOrganization =
      input.targetType === RegistrationTargetType.UNIVERSITY
        ? await this.repository.findUniversityByUserId(applicantUserId)
        : await this.repository.findIndustryByUserId(applicantUserId);

    if (existingOrganization) {
      throw new AppError(
        "Your account is already linked to an organization",
        409,
        "ORGANIZATION_ALREADY_LINKED",
      );
    }

    const application = await this.repository.createApplication({
      applicantUserId,
      targetType: input.targetType,
      organizationName: input.organization.name,
      registrationNumber: input.organization.registrationNumber,
      applicationData: toJsonValue(input.organization),
    });
    return toApplicationResponse(application);
  }

  async submitPublicApplication(
    input: PublicRegistrationApplicationInput,
  ): Promise<OrganizationApplicationResponse> {
    await this.ensureOrganizationAvailable(
      input.organization.name,
      input.organization.registrationNumber,
    );
    if (
      await this.repository.findUserByEmail(
        input.applicant.email.trim().toLowerCase(),
      )
    ) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "EMAIL_ALREADY_REGISTERED",
      );
    }

    try {
      const application = await this.repository.createPublicApplication({
        applicantUserId: randomUUID(),
        applicantEmail: input.applicant.email.trim().toLowerCase(),
        applicantDisplayName: input.applicant.displayName,
        passwordHash: await bcrypt.hash(input.applicant.password, 12),
        targetType: input.targetType,
        organizationName: input.organization.name,
        registrationNumber: input.organization.registrationNumber,
        applicationData: toJsonValue(input.organization),
      });
      return toApplicationResponse(application);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "An account with this email already exists",
          409,
          "EMAIL_ALREADY_REGISTERED",
        );
      }
      throw error;
    }
  }

  async listApplications(
    status?: RegistrationStatus,
  ): Promise<OrganizationApplicationResponse[]> {
    const applications = await this.repository.listApplications(status);
    return applications.map(toApplicationResponse);
  }

  async getApplication(
    applicationId: string,
  ): Promise<OrganizationApplicationResponse> {
    const application =
      await this.repository.findApplicationById(applicationId);
    if (!application) {
      throw new AppError(
        "Registration application not found",
        404,
        "REGISTRATION_APPLICATION_NOT_FOUND",
      );
    }
    return toApplicationResponse(application);
  }

  async approveApplication(
    applicationId: string,
    ministryUserId: string,
  ): Promise<OrganizationApplicationResponse> {
    const application =
      await this.repository.findApplicationById(applicationId);
    if (!application) {
      throw new AppError(
        "Registration application not found",
        404,
        "REGISTRATION_APPLICATION_NOT_FOUND",
      );
    }

    const organization = parseApplicationOrganization(application);
    await this.ensureOrganizationAvailable(
      organization.name,
      organization.registrationNumber,
    );
    const approved = await this.repository.approveApplication({
      applicationId,
      ministryUserId,
      organization,
    });
    return toApplicationResponse(approved.application);
  }

  async rejectApplication(
    applicationId: string,
    ministryUserId: string,
    reason: string,
  ): Promise<OrganizationApplicationResponse> {
    const application = await this.repository.rejectApplication(
      applicationId,
      ministryUserId,
      reason,
    );
    return toApplicationResponse(application);
  }

  private async ensureOrganizationAvailable(
    name: string,
    registrationNumber?: string,
  ): Promise<void> {
    if (
      await this.repository.hasOrganizationConflict(name, registrationNumber)
    ) {
      throw new AppError(
        "An organization with the same name or registration number already exists",
        409,
        "DUPLICATE_ORGANIZATION",
      );
    }
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    if (await this.repository.findUserByEmail(email.trim().toLowerCase())) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "EMAIL_ALREADY_REGISTERED",
      );
    }
  }
}

function roleForTarget(targetType: RegistrationTargetType): UserRole {
  return targetType === RegistrationTargetType.UNIVERSITY
    ? UserRole.UNIVERSITY
    : UserRole.INDUSTRY;
}

function toJsonValue(value: unknown): object {
  return JSON.parse(JSON.stringify(value)) as object;
}

function parseApplicationOrganization(
  application: RegistrationApplicationRecord,
) {
  const schema =
    application.targetType === RegistrationTargetType.UNIVERSITY
      ? universityDetailsSchema
      : industryDetailsSchema;
  const parsed = schema.safeParse(application.applicationData);
  if (!parsed.success) {
    throw new AppError(
      "The application contains invalid organization data",
      422,
      "INVALID_REGISTRATION_DATA",
    );
  }
  return parsed.data;
}

function toApplicationResponse(
  application: RegistrationApplicationRecord,
): OrganizationApplicationResponse {
  return {
    id: application.id,
    targetType: application.targetType,
    organizationName: application.organizationName,
    registrationNumber: application.registrationNumber,
    status: application.status,
    applicationData: application.applicationData,
    applicantUserId: application.applicantUserId,
    applicant: application.applicant,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    reviewReason: application.reviewReason,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

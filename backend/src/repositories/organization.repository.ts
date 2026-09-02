import {
  Prisma,
  type PrismaClient,
  RegistrationStatus,
  RegistrationTargetType,
  UserRole,
} from "@prisma/client";
import { database } from "../config/database.js";
import type {
  IndustryDetailsInput,
  UniversityDetailsInput,
} from "../types/organization.js";
import { AppError } from "../utils/appError.js";
import { authUserSelect, type AuthUserRecord } from "./auth.repository.js";

const universityProfileInclude = {
  faculty: { orderBy: { name: "asc" as const } },
  researchAreas: { orderBy: { name: "asc" as const } },
  labs: { orderBy: { name: "asc" as const } },
  facilities: { orderBy: { name: "asc" as const } },
  previousProjects: { orderBy: { title: "asc" as const } },
} as const;

const industryProfileInclude = {
  expertise: { orderBy: { name: "asc" as const } },
  interestAreas: { orderBy: { name: "asc" as const } },
  supportCapabilities: { orderBy: { name: "asc" as const } },
} as const;

const applicationInclude = {
  applicant: {
    select: { id: true, email: true, displayName: true, role: true },
  },
  reviewer: { select: { id: true, displayName: true, email: true } },
} as const;

export type UniversityProfileRecord = Prisma.UniversityGetPayload<{
  include: typeof universityProfileInclude;
}>;
export type IndustryProfileRecord = Prisma.IndustryGetPayload<{
  include: typeof industryProfileInclude;
}>;
export type RegistrationApplicationRecord =
  Prisma.RegistrationApplicationGetPayload<{
    include: typeof applicationInclude;
  }>;

export interface CreateApplicationInput {
  applicantUserId: string;
  targetType: RegistrationTargetType;
  organizationName: string;
  registrationNumber?: string;
  applicationData: Prisma.InputJsonValue;
}

export interface CreatePublicApplicationInput {
  applicantUserId: string;
  applicantEmail: string;
  applicantDisplayName: string;
  passwordHash: string;
  targetType: RegistrationTargetType;
  organizationName: string;
  registrationNumber?: string;
  applicationData: Prisma.InputJsonValue;
}

export interface CreateOrganizationAccountInput {
  ministryUserId: string;
  targetType: RegistrationTargetType;
  email: string;
  displayName: string;
  passwordHash: string;
  organization: UniversityDetailsInput | IndustryDetailsInput;
}

export interface ApproveApplicationInput {
  applicationId: string;
  ministryUserId: string;
  organization: UniversityDetailsInput | IndustryDetailsInput;
}

export class OrganizationRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findUniversityByUserId(
    userId: string,
  ): Promise<UniversityProfileRecord | null> {
    return this.client.university.findFirst({
      where: { users: { some: { id: userId } } },
      include: universityProfileInclude,
    });
  }

  findIndustryByUserId(userId: string): Promise<IndustryProfileRecord | null> {
    return this.client.industry.findFirst({
      where: { users: { some: { id: userId } } },
      include: industryProfileInclude,
    });
  }

  findUserByEmail(email: string): Promise<{ id: string } | null> {
    return this.client.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  async hasOrganizationConflict(
    name: string,
    registrationNumber?: string,
    exclude?: { targetType: RegistrationTargetType; id: string },
  ): Promise<boolean> {
    const nameFilter = { equals: name, mode: "insensitive" as const };
    const registrationFilter = registrationNumber
      ? { equals: registrationNumber, mode: "insensitive" as const }
      : undefined;
    const [university, industry] = await Promise.all([
      this.client.university.findFirst({
        where: {
          ...(exclude?.targetType === RegistrationTargetType.UNIVERSITY
            ? { NOT: { id: exclude.id } }
            : {}),
          OR: [
            { name: nameFilter },
            ...(registrationFilter
              ? [{ registrationNumber: registrationFilter }]
              : []),
          ],
        },
        select: { id: true },
      }),
      this.client.industry.findFirst({
        where: {
          ...(exclude?.targetType === RegistrationTargetType.INDUSTRY
            ? { NOT: { id: exclude.id } }
            : {}),
          OR: [
            { name: nameFilter },
            ...(registrationFilter
              ? [{ registrationNumber: registrationFilter }]
              : []),
          ],
        },
        select: { id: true },
      }),
    ]);
    return Boolean(university || industry);
  }

  async updateUniversityProfile(
    userId: string,
    universityId: string,
    organization: UniversityDetailsInput,
  ): Promise<UniversityProfileRecord> {
    return this.client.$transaction(async (transaction) => {
      await transaction.university.update({
        where: { id: universityId },
        data: {
          name: organization.name,
          shortName: organization.shortName ?? null,
          registrationNumber: organization.registrationNumber ?? null,
          description: organization.description ?? null,
          website: organization.website ?? null,
          city: organization.city ?? null,
          state: organization.state ?? null,
          country: organization.country,
        },
      });

      await replaceUniversityCollections(
        transaction,
        universityId,
        organization,
      );
      await transaction.user.update({
        where: { id: userId },
        data: { mustCompleteProfile: false },
      });

      return transaction.university.findUniqueOrThrow({
        where: { id: universityId },
        include: universityProfileInclude,
      });
    });
  }

  async updateIndustryProfile(
    userId: string,
    industryId: string,
    organization: IndustryDetailsInput,
  ): Promise<IndustryProfileRecord> {
    return this.client.$transaction(async (transaction) => {
      await transaction.industry.update({
        where: { id: industryId },
        data: {
          name: organization.name,
          registrationNumber: organization.registrationNumber ?? null,
          description: organization.description ?? null,
          website: organization.website ?? null,
          sector: organization.sector ?? null,
          city: organization.city ?? null,
          state: organization.state ?? null,
          country: organization.country,
        },
      });

      await replaceIndustryCollections(transaction, industryId, organization);
      await transaction.user.update({
        where: { id: userId },
        data: { mustCompleteProfile: false },
      });

      return transaction.industry.findUniqueOrThrow({
        where: { id: industryId },
        include: industryProfileInclude,
      });
    });
  }

  createApplication(
    input: CreateApplicationInput,
  ): Promise<RegistrationApplicationRecord> {
    return this.client.registrationApplication.create({
      data: {
        applicantUserId: input.applicantUserId,
        targetType: input.targetType,
        organizationName: input.organizationName,
        registrationNumber: input.registrationNumber ?? null,
        applicationData: input.applicationData,
      },
      include: applicationInclude,
    });
  }

  async createPublicApplication(
    input: CreatePublicApplicationInput,
  ): Promise<RegistrationApplicationRecord> {
    return this.client.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          id: input.applicantUserId,
          email: input.applicantEmail,
          passwordHash: input.passwordHash,
          role: roleForTarget(input.targetType),
          displayName: input.applicantDisplayName,
          isActive: false,
          mustCompleteProfile: true,
        },
      });

      return transaction.registrationApplication.create({
        data: {
          applicantUserId: input.applicantUserId,
          targetType: input.targetType,
          organizationName: input.organizationName,
          registrationNumber: input.registrationNumber ?? null,
          applicationData: input.applicationData,
        },
        include: applicationInclude,
      });
    });
  }

  findApplicationById(
    applicationId: string,
  ): Promise<RegistrationApplicationRecord | null> {
    return this.client.registrationApplication.findUnique({
      where: { id: applicationId },
      include: applicationInclude,
    });
  }

  listApplications(
    status?: RegistrationStatus,
  ): Promise<RegistrationApplicationRecord[]> {
    return this.client.registrationApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: applicationInclude,
    });
  }

  async rejectApplication(
    applicationId: string,
    ministryUserId: string,
    reason: string,
  ): Promise<RegistrationApplicationRecord> {
    return this.client.$transaction(async (transaction) => {
      const result = await transaction.registrationApplication.updateMany({
        where: { id: applicationId, status: RegistrationStatus.PENDING },
        data: {
          status: RegistrationStatus.REJECTED,
          reviewedById: ministryUserId,
          reviewedAt: new Date(),
          reviewReason: reason,
        },
      });

      if (result.count !== 1) {
        throw applicationNotPendingError();
      }

      return transaction.registrationApplication.findUniqueOrThrow({
        where: { id: applicationId },
        include: applicationInclude,
      });
    });
  }

  async createOrganizationAccount(
    input: CreateOrganizationAccountInput,
  ): Promise<{ organizationId: string; user: AuthUserRecord }> {
    return this.client.$transaction(async (transaction) => {
      const organizationId = await createApprovedOrganization(
        transaction,
        input.targetType,
        input.organization,
        input.ministryUserId,
      );

      await transaction.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          role: roleForTarget(input.targetType),
          displayName: input.displayName,
          isActive: true,
          mustChangePassword: true,
          mustCompleteProfile: true,
          ...(input.targetType === RegistrationTargetType.UNIVERSITY
            ? { universityId: organizationId }
            : { industryId: organizationId }),
        },
      });

      const user = await transaction.user.findUniqueOrThrow({
        where: { email: input.email },
        select: authUserSelect,
      });

      return { organizationId, user };
    });
  }

  async approveApplication(input: ApproveApplicationInput): Promise<{
    application: RegistrationApplicationRecord;
    organizationId: string;
    user: AuthUserRecord;
  }> {
    return this.client.$transaction(async (transaction) => {
      const claimed = await transaction.registrationApplication.updateMany({
        where: {
          id: input.applicationId,
          status: RegistrationStatus.PENDING,
        },
        data: {
          status: RegistrationStatus.UNDER_REVIEW,
          reviewedById: input.ministryUserId,
          reviewedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        throw applicationNotPendingError();
      }

      const application =
        await transaction.registrationApplication.findUniqueOrThrow({
          where: { id: input.applicationId },
        });
      const applicant = await transaction.user.findUniqueOrThrow({
        where: { id: application.applicantUserId },
      });
      const targetRole = roleForTarget(application.targetType);

      if (
        applicant.role !== targetRole ||
        (application.targetType === RegistrationTargetType.UNIVERSITY
          ? applicant.universityId
          : applicant.industryId)
      ) {
        throw new AppError(
          "The applicant account is already linked or has the wrong role",
          409,
          "APPLICANT_ACCOUNT_CONFLICT",
        );
      }

      const organizationId = await createApprovedOrganization(
        transaction,
        application.targetType,
        input.organization,
        input.ministryUserId,
      );

      await transaction.user.update({
        where: { id: applicant.id },
        data: {
          isActive: true,
          mustCompleteProfile: true,
          ...(application.targetType === RegistrationTargetType.UNIVERSITY
            ? { universityId: organizationId }
            : { industryId: organizationId }),
        },
      });

      await transaction.registrationApplication.update({
        where: { id: application.id },
        data: {
          status: RegistrationStatus.APPROVED,
          approvedUniversityId:
            application.targetType === RegistrationTargetType.UNIVERSITY
              ? organizationId
              : null,
          approvedIndustryId:
            application.targetType === RegistrationTargetType.INDUSTRY
              ? organizationId
              : null,
          reviewReason: null,
        },
      });

      const approvedApplication =
        await transaction.registrationApplication.findUniqueOrThrow({
          where: { id: application.id },
          include: applicationInclude,
        });
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: applicant.id },
        select: authUserSelect,
      });

      return { application: approvedApplication, organizationId, user };
    });
  }
}

function roleForTarget(targetType: RegistrationTargetType): UserRole {
  return targetType === RegistrationTargetType.UNIVERSITY
    ? UserRole.UNIVERSITY
    : UserRole.INDUSTRY;
}

function applicationNotPendingError(): AppError {
  return new AppError(
    "Only pending applications can be reviewed",
    409,
    "APPLICATION_NOT_PENDING",
  );
}

async function createApprovedOrganization(
  transaction: Prisma.TransactionClient,
  targetType: RegistrationTargetType,
  organization: UniversityDetailsInput | IndustryDetailsInput,
  ministryUserId: string,
): Promise<string> {
  if (targetType === RegistrationTargetType.UNIVERSITY) {
    const universityOrganization = organization as UniversityDetailsInput;
    const university = await transaction.university.create({
      data: {
        name: universityOrganization.name,
        shortName: universityOrganization.shortName ?? null,
        registrationNumber: universityOrganization.registrationNumber ?? null,
        description: universityOrganization.description ?? null,
        website: universityOrganization.website ?? null,
        city: universityOrganization.city ?? null,
        state: universityOrganization.state ?? null,
        country: universityOrganization.country,
        isApproved: true,
        approvedById: ministryUserId,
        approvedAt: new Date(),
        createdById: ministryUserId,
        faculty: {
          create: universityOrganization.faculty.map(toFacultyCreate),
        },
        researchAreas: { create: universityOrganization.researchAreas },
        labs: { create: universityOrganization.labs },
        facilities: { create: universityOrganization.facilities },
        previousProjects: {
          create: universityOrganization.previousProjects.map(
            toPreviousProjectCreate,
          ),
        },
      },
    });
    return university.id;
  }

  const industryOrganization = organization as IndustryDetailsInput;
  const industry = await transaction.industry.create({
    data: {
      name: industryOrganization.name,
      registrationNumber: industryOrganization.registrationNumber ?? null,
      description: industryOrganization.description ?? null,
      website: industryOrganization.website ?? null,
      sector: industryOrganization.sector ?? null,
      city: industryOrganization.city ?? null,
      state: industryOrganization.state ?? null,
      country: industryOrganization.country,
      isApproved: true,
      approvedById: ministryUserId,
      approvedAt: new Date(),
      createdById: ministryUserId,
      expertise: { create: industryOrganization.expertise },
      interestAreas: {
        create: industryOrganization.interestAreas.map((name) => ({ name })),
      },
      supportCapabilities: { create: industryOrganization.supportCapabilities },
    },
  });
  return industry.id;
}

async function replaceUniversityCollections(
  transaction: Prisma.TransactionClient,
  universityId: string,
  organization: UniversityDetailsInput,
): Promise<void> {
  await transaction.universityFaculty.deleteMany({ where: { universityId } });
  await transaction.universityResearchArea.deleteMany({
    where: { universityId },
  });
  await transaction.universityLab.deleteMany({ where: { universityId } });
  await transaction.universityFacility.deleteMany({ where: { universityId } });
  await transaction.universityPreviousProject.deleteMany({
    where: { universityId },
  });

  await transaction.universityFaculty.createMany({
    data: organization.faculty.map((item) => ({
      universityId,
      name: item.name,
      title: item.title ?? null,
      department: item.department ?? null,
      profile: item.profile ?? null,
      researchFocus: item.researchFocus ?? null,
      email: item.email ?? null,
    })),
  });
  await transaction.universityResearchArea.createMany({
    data: organization.researchAreas.map((item) => ({ ...item, universityId })),
  });
  await transaction.universityLab.createMany({
    data: organization.labs.map((item) => ({ ...item, universityId })),
  });
  await transaction.universityFacility.createMany({
    data: organization.facilities.map((item) => ({ ...item, universityId })),
  });
  await transaction.universityPreviousProject.createMany({
    data: organization.previousProjects.map((item) => ({
      ...toPreviousProjectCreate(item),
      universityId,
    })),
  });
}

async function replaceIndustryCollections(
  transaction: Prisma.TransactionClient,
  industryId: string,
  organization: IndustryDetailsInput,
): Promise<void> {
  await transaction.industryExpertise.deleteMany({ where: { industryId } });
  await transaction.industryInterestArea.deleteMany({ where: { industryId } });
  await transaction.industrySupportCapability.deleteMany({
    where: { industryId },
  });

  await transaction.industryExpertise.createMany({
    data: organization.expertise.map((item) => ({ ...item, industryId })),
  });
  await transaction.industryInterestArea.createMany({
    data: organization.interestAreas.map((name) => ({ name, industryId })),
  });
  await transaction.industrySupportCapability.createMany({
    data: organization.supportCapabilities.map((item) => ({
      ...item,
      industryId,
    })),
  });
}

function toFacultyCreate(item: UniversityDetailsInput["faculty"][number]) {
  return {
    name: item.name,
    title: item.title ?? null,
    department: item.department ?? null,
    profile: item.profile ?? null,
    researchFocus: item.researchFocus ?? null,
    email: item.email ?? null,
  };
}

function toPreviousProjectCreate(
  item: UniversityDetailsInput["previousProjects"][number],
) {
  return {
    title: item.title,
    summary: item.summary ?? null,
    domains: item.domains,
    outcomes: item.outcomes ?? null,
    completedAt: item.completedAt ? new Date(item.completedAt) : null,
  };
}

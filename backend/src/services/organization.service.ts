import { OrganizationRepository } from "../repositories/organization.repository.js";
import { RegistrationTargetType } from "@prisma/client";
import type {
  IndustryDetailsInput,
  UniversityDetailsInput,
} from "../types/organization.js";
import { AppError } from "../utils/appError.js";

export interface OrganizationServiceContract {
  getUniversityProfile(userId: string): Promise<unknown>;
  updateUniversityProfile(
    userId: string,
    profile: UniversityDetailsInput,
  ): Promise<unknown>;
  getIndustryProfile(userId: string): Promise<unknown>;
  updateIndustryProfile(
    userId: string,
    profile: IndustryDetailsInput,
  ): Promise<unknown>;
}

export class OrganizationService implements OrganizationServiceContract {
  constructor(
    private readonly repository: OrganizationRepository = new OrganizationRepository(),
  ) {}

  async getUniversityProfile(userId: string): Promise<unknown> {
    const university = await this.getApprovedUniversity(userId);
    return toUniversityProfile(university);
  }

  async updateUniversityProfile(
    userId: string,
    profile: UniversityDetailsInput,
  ): Promise<unknown> {
    const university = await this.getApprovedUniversity(userId);
    await this.ensureOrganizationAvailable(
      profile.name,
      profile.registrationNumber,
      { targetType: RegistrationTargetType.UNIVERSITY, id: university.id },
    );
    const updated = await this.repository.updateUniversityProfile(
      userId,
      university.id,
      profile,
    );
    return toUniversityProfile(updated);
  }

  async getIndustryProfile(userId: string): Promise<unknown> {
    const industry = await this.getApprovedIndustry(userId);
    return toIndustryProfile(industry);
  }

  async updateIndustryProfile(
    userId: string,
    profile: IndustryDetailsInput,
  ): Promise<unknown> {
    const industry = await this.getApprovedIndustry(userId);
    await this.ensureOrganizationAvailable(
      profile.name,
      profile.registrationNumber,
      { targetType: RegistrationTargetType.INDUSTRY, id: industry.id },
    );
    const updated = await this.repository.updateIndustryProfile(
      userId,
      industry.id,
      profile,
    );
    return toIndustryProfile(updated);
  }

  private async getApprovedUniversity(userId: string) {
    const university = await this.repository.findUniversityByUserId(userId);
    if (!university) {
      throw new AppError(
        "No university organization is linked to this account",
        404,
        "UNIVERSITY_PROFILE_NOT_FOUND",
      );
    }
    if (!university.isApproved) {
      throw new AppError(
        "The university organization is not approved",
        403,
        "ORGANIZATION_NOT_APPROVED",
      );
    }
    return university;
  }

  private async getApprovedIndustry(userId: string) {
    const industry = await this.repository.findIndustryByUserId(userId);
    if (!industry) {
      throw new AppError(
        "No industry organization is linked to this account",
        404,
        "INDUSTRY_PROFILE_NOT_FOUND",
      );
    }
    if (!industry.isApproved) {
      throw new AppError(
        "The industry organization is not approved",
        403,
        "ORGANIZATION_NOT_APPROVED",
      );
    }
    return industry;
  }

  private async ensureOrganizationAvailable(
    name: string,
    registrationNumber: string | undefined,
    exclude: { targetType: RegistrationTargetType; id: string },
  ): Promise<void> {
    if (
      await this.repository.hasOrganizationConflict(
        name,
        registrationNumber,
        exclude,
      )
    ) {
      throw new AppError(
        "An organization with the same name or registration number already exists",
        409,
        "DUPLICATE_ORGANIZATION",
      );
    }
  }
}

function toUniversityProfile(
  university: Awaited<
    ReturnType<OrganizationRepository["findUniversityByUserId"]>
  >,
) {
  if (!university) {
    throw new Error("University profile cannot be null");
  }
  return {
    id: university.id,
    name: university.name,
    shortName: university.shortName,
    registrationNumber: university.registrationNumber,
    description: university.description,
    website: university.website,
    city: university.city,
    state: university.state,
    country: university.country,
    isApproved: university.isApproved,
    faculty: university.faculty,
    researchAreas: university.researchAreas,
    laboratories: university.labs,
    facilities: university.facilities,
    previousProjects: university.previousProjects,
  };
}

function toIndustryProfile(
  industry: Awaited<ReturnType<OrganizationRepository["findIndustryByUserId"]>>,
) {
  if (!industry) {
    throw new Error("Industry profile cannot be null");
  }
  return {
    id: industry.id,
    name: industry.name,
    registrationNumber: industry.registrationNumber,
    description: industry.description,
    website: industry.website,
    sector: industry.sector,
    city: industry.city,
    state: industry.state,
    country: industry.country,
    isApproved: industry.isApproved,
    expertise: industry.expertise,
    interestAreas: industry.interestAreas,
    supportCapabilities: industry.supportCapabilities,
  };
}

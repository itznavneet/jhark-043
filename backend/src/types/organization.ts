import type {
  RegistrationStatus,
  RegistrationTargetType,
  UniversityFacilityType,
} from "@prisma/client";
import type { PublicUser } from "./auth.js";

export interface FacultyInput {
  name: string;
  title?: string;
  department?: string;
  profile?: string;
  researchFocus?: string;
  email?: string;
}

export interface ResearchAreaInput {
  name: string;
  description?: string;
}

export interface LabInput {
  name: string;
  description?: string;
  capabilities: string[];
}

export interface FacilityInput {
  name: string;
  type: UniversityFacilityType;
  description?: string;
  capabilities: string[];
}

export interface PreviousProjectInput {
  title: string;
  summary?: string;
  domains: string[];
  outcomes?: string;
  completedAt?: string;
}

export interface UniversityDetailsInput {
  name: string;
  shortName?: string;
  registrationNumber?: string;
  phone?: string;
  address?: string;
  description?: string;
  website?: string;
  city?: string;
  district?: string;
  state?: string;
  country: string;
  faculty: FacultyInput[];
  researchAreas: ResearchAreaInput[];
  labs: LabInput[];
  facilities: FacilityInput[];
  previousProjects: PreviousProjectInput[];
  departments?: string[];
  capabilities?: string[];
  applicationContact?: string;
}

export interface ExpertiseInput {
  name: string;
  description?: string;
}

export interface IndustryDetailsInput {
  name: string;
  registrationNumber?: string;
  organizationType?: string;
  phone?: string;
  address?: string;
  description?: string;
  website?: string;
  sector?: string;
  city?: string;
  district?: string;
  state?: string;
  country: string;
  expertise: ExpertiseInput[];
  interestAreas: string[];
  supportCapabilities: ExpertiseInput[];
  technologyAreas?: string[];
  fundingCapability?: string;
  technicalSupportCapability?: string;
  fieldDeploymentCapability?: string;
  contactPerson?: string;
}

export type OrganizationDetailsInput =
  UniversityDetailsInput | IndustryDetailsInput;

export interface OrganizationApplicationResponse {
  id: string;
  targetType: RegistrationTargetType;
  organizationName: string;
  registrationNumber: string | null;
  status: RegistrationStatus;
  applicationData: unknown;
  applicantUserId: string;
  reviewedAt: string | null;
  reviewReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedOrganizationAccountResponse {
  targetType: RegistrationTargetType;
  organizationId: string;
  user: PublicUser;
  initialCredentials: {
    email: string;
    temporaryPassword: string;
  };
}

export interface PublicRegistrationApplicationInput {
  targetType: RegistrationTargetType;
  applicant: {
    email: string;
    displayName: string;
    password: string;
    confirmPassword: string;
  };
  organization: OrganizationDetailsInput;
}

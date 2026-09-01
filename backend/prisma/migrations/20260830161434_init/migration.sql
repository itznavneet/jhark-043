-- Required before the UniversityKnowledgeEmbedding vector column is created.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MINISTRY_ADMIN', 'SUBMITTER', 'UNIVERSITY', 'INDUSTRY');

-- CreateEnum
CREATE TYPE "SubmitterType" AS ENUM ('INDIVIDUAL', 'PANCHAYATI_RAJ_INSTITUTION', 'COMMUNITY_ORGANIZATION', 'GOVERNMENT_ORGANIZATION', 'OTHER_ORGANIZATION');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('SUBMITTED', 'AI_VALIDATED', 'AI_REJECTED', 'MINISTRY_REVIEW', 'MINISTRY_APPROVED', 'MINISTRY_REJECTED', 'AI_UNIVERSITY_MATCHED', 'UNIVERSITIES_RECOMMENDED', 'MINISTRY_APPROVED_UNIVERSITIES', 'INVITATIONS_SENT', 'UNIVERSITY_ACCEPTED', 'UNIVERSITY_REJECTED', 'TEAM_FORMED', 'PROPOSAL_DRAFT', 'PROPOSAL_SUBMITTED', 'INDUSTRY_REVIEW', 'INDUSTRY_ACCEPTED', 'INDUSTRY_REJECTED', 'COLLABORATION_CONFIRMED', 'PROTOTYPE_DEVELOPMENT', 'FIELD_PILOT', 'IMPLEMENTATION', 'IMPACT_MEASURED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'INVITED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RegistrationTargetType" AS ENUM ('UNIVERSITY', 'INDUSTRY');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_INDUSTRY_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "IndustryProposalInterestStatus" AS ENUM ('EXPRESSED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "IndustryCollaborationStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'CONFIRMED', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('INITIATED', 'PROTOTYPE_DEVELOPMENT', 'FIELD_PILOT', 'IMPLEMENTATION', 'IMPACT_MEASURED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProblemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AiValidationDecision" AS ENUM ('VALID', 'INVALID', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ProblemEvidenceType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'LINK', 'DATASET', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchDecision" AS ENUM ('RECOMMENDED', 'APPROVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "UniversityFacilityType" AS ENUM ('INNOVATION_CENTER', 'INCUBATION_FACILITY', 'TESTING_FACILITY', 'FIELD_SITE', 'OTHER');

-- CreateEnum
CREATE TYPE "TeamMemberType" AS ENUM ('FACULTY_MENTOR', 'RESEARCH_STUDENT', 'INDUSTRY_EXPERT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProposalDocumentType" AS ENUM ('SOLUTION_DESIGN', 'BUDGET', 'PRESENTATION', 'SUPPORTING_EVIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectDocumentType" AS ENUM ('PROTOTYPE_ARTIFACT', 'PILOT_REPORT', 'IMPLEMENTATION_PLAN', 'IMPACT_EVIDENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('FINANCIAL', 'CSR_GRANT', 'EQUIPMENT', 'IN_KIND', 'EXPERTISE', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingStatus" AS ENUM ('PROPOSED', 'COMMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SearchableSourceType" AS ENUM ('UNIVERSITY_PROFILE', 'FACULTY_PROFILE', 'RESEARCH_AREA', 'LABORATORY', 'FACILITY', 'PREVIOUS_PROJECT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIFECYCLE_UPDATE', 'INVITATION', 'PROPOSAL_INTEREST', 'COLLABORATION_UPDATE', 'REGISTRATION_UPDATE', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "displayName" VARCHAR(160) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "universityId" UUID,
    "industryId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmitterProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "SubmitterType" NOT NULL,
    "displayName" VARCHAR(160) NOT NULL,
    "organizationName" VARCHAR(255),
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SubmitterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" UUID NOT NULL,
    "submitterId" UUID NOT NULL,
    "categoryId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "societalContext" TEXT,
    "geography" VARCHAR(255),
    "desiredOutcome" TEXT,
    "currentStatus" "ProblemStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemEvidence" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "type" "ProblemEvidenceType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "fileName" VARCHAR(255),
    "storageKey" VARCHAR(500),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" BIGINT,
    "externalUrl" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAIAnalysis" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "categoryId" UUID,
    "validationDecision" "AiValidationDecision" NOT NULL,
    "isSocietalProblem" BOOLEAN NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "requiredExpertise" TEXT[],
    "requiredFacilities" TEXT[],
    "priority" "ProblemPriority",
    "confidence" DECIMAL(5,4),
    "modelName" VARCHAR(120),
    "promptVersion" VARCHAR(80),
    "rawResponse" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemStatusHistory" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "actorUserId" UUID,
    "oldStatus" "ProblemStatus",
    "newStatus" "ProblemStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "shortName" VARCHAR(80),
    "registrationNumber" VARCHAR(120),
    "description" TEXT,
    "website" VARCHAR(500),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "country" VARCHAR(120) NOT NULL DEFAULT 'India',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityFaculty" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "title" VARCHAR(160),
    "department" VARCHAR(160),
    "profile" TEXT,
    "researchFocus" TEXT,
    "email" VARCHAR(320),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityFaculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityResearchArea" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityResearchArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityLab" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "capabilities" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityLab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityFacility" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "UniversityFacilityType" NOT NULL,
    "description" TEXT,
    "capabilities" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityPreviousProject" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "domains" TEXT[],
    "outcomes" TEXT,
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityPreviousProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityKnowledgeEmbedding" (
    "id" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "sourceType" "SearchableSourceType" NOT NULL,
    "sourceId" UUID NOT NULL,
    "contentText" TEXT NOT NULL,
    "embedding" vector,
    "embeddingModel" VARCHAR(120) NOT NULL,
    "dimensions" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityKnowledgeEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(120),
    "description" TEXT,
    "website" VARCHAR(500),
    "sector" VARCHAR(160),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "country" VARCHAR(120) NOT NULL DEFAULT 'India',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryExpertise" (
    "id" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryInterestArea" (
    "id" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryInterestArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemUniversityMatch" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "matchScore" DECIMAL(6,5) NOT NULL,
    "rank" INTEGER NOT NULL,
    "decision" "MatchDecision" NOT NULL DEFAULT 'RECOMMENDED',
    "justification" TEXT NOT NULL,
    "matchingMetadata" JSONB,
    "evidence" JSONB,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "removedById" UUID,
    "removedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProblemUniversityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityProblemAssignment" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "matchId" UUID,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMPTZ(6),
    "respondedAt" TIMESTAMPTZ(6),
    "responseNote" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityProblemAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTeam" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "formedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProjectTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID,
    "memberType" "TeamMemberType" NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "roleTitle" VARCHAR(160),
    "department" VARCHAR(160),
    "email" VARCHAR(320),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "teamId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "solutionSummary" TEXT NOT NULL,
    "technicalApproach" TEXT,
    "expectedOutcomes" TEXT,
    "requestedSupport" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalDocument" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "type" "ProposalDocumentType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "storageKey" VARCHAR(500),
    "externalUrl" VARCHAR(1000),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryProposalInterest" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "status" "IndustryProposalInterestStatus" NOT NULL DEFAULT 'EXPRESSED',
    "message" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IndustryProposalInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryCollaboration" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "projectId" UUID,
    "status" "IndustryCollaborationStatus" NOT NULL DEFAULT 'PROPOSED',
    "supportSummary" TEXT,
    "confirmedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IndustryCollaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryFunding" (
    "id" UUID NOT NULL,
    "collaborationId" UUID NOT NULL,
    "fundingType" "FundingType" NOT NULL,
    "status" "FundingStatus" NOT NULL DEFAULT 'PROPOSED',
    "amount" DECIMAL(14,2),
    "currencyCode" CHAR(3),
    "description" TEXT,
    "committedAt" TIMESTAMPTZ(6),
    "receivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IndustryFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'INITIATED',
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedStart" TIMESTAMPTZ(6),
    "plannedEnd" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectUpdate" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "authorUserId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "type" "ProjectDocumentType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "storageKey" VARCHAR(500),
    "externalUrl" VARCHAR(1000),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactMeasurement" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "metricName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "baseline" DECIMAL(18,4),
    "target" DECIMAL(18,4),
    "actual" DECIMAL(18,4),
    "unit" VARCHAR(80),
    "measuredAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ImpactMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationApplication" (
    "id" UUID NOT NULL,
    "applicantUserId" UUID NOT NULL,
    "submitterProfileId" UUID,
    "targetType" "RegistrationTargetType" NOT NULL,
    "organizationName" VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(120),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "applicationData" JSONB,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewReason" TEXT,
    "approvedUniversityId" UUID,
    "approvedIndustryId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RegistrationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationApplicationDocument" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "storageKey" VARCHAR(500),
    "externalUrl" VARCHAR(1000),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" BIGINT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_universityId_idx" ON "User"("universityId");

-- CreateIndex
CREATE INDEX "User_industryId_idx" ON "User"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_expiresAt_idx" ON "RefreshSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubmitterProfile_userId_key" ON "SubmitterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemCategory_name_key" ON "ProblemCategory"("name");

-- CreateIndex
CREATE INDEX "Problem_submitterId_createdAt_idx" ON "Problem"("submitterId", "createdAt");

-- CreateIndex
CREATE INDEX "Problem_currentStatus_idx" ON "Problem"("currentStatus");

-- CreateIndex
CREATE INDEX "Problem_categoryId_idx" ON "Problem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemEvidence_storageKey_key" ON "ProblemEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "ProblemEvidence_problemId_createdAt_idx" ON "ProblemEvidence"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "ProblemAIAnalysis_problemId_createdAt_idx" ON "ProblemAIAnalysis"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "ProblemAIAnalysis_validationDecision_idx" ON "ProblemAIAnalysis"("validationDecision");

-- CreateIndex
CREATE INDEX "ProblemStatusHistory_problemId_createdAt_idx" ON "ProblemStatusHistory"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "ProblemStatusHistory_actorUserId_idx" ON "ProblemStatusHistory"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");

-- CreateIndex
CREATE UNIQUE INDEX "University_shortName_key" ON "University"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "University_registrationNumber_key" ON "University"("registrationNumber");

-- CreateIndex
CREATE INDEX "University_isApproved_idx" ON "University"("isApproved");

-- CreateIndex
CREATE INDEX "University_state_city_idx" ON "University"("state", "city");

-- CreateIndex
CREATE INDEX "UniversityFaculty_universityId_idx" ON "UniversityFaculty"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityFaculty_universityId_name_department_key" ON "UniversityFaculty"("universityId", "name", "department");

-- CreateIndex
CREATE INDEX "UniversityResearchArea_name_idx" ON "UniversityResearchArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityResearchArea_universityId_name_key" ON "UniversityResearchArea"("universityId", "name");

-- CreateIndex
CREATE INDEX "UniversityLab_universityId_idx" ON "UniversityLab"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityLab_universityId_name_key" ON "UniversityLab"("universityId", "name");

-- CreateIndex
CREATE INDEX "UniversityFacility_universityId_type_idx" ON "UniversityFacility"("universityId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityFacility_universityId_name_key" ON "UniversityFacility"("universityId", "name");

-- CreateIndex
CREATE INDEX "UniversityPreviousProject_universityId_idx" ON "UniversityPreviousProject"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityPreviousProject_universityId_title_key" ON "UniversityPreviousProject"("universityId", "title");

-- CreateIndex
CREATE INDEX "UniversityKnowledgeEmbedding_universityId_sourceType_idx" ON "UniversityKnowledgeEmbedding"("universityId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityKnowledgeEmbedding_sourceType_sourceId_embeddingM_key" ON "UniversityKnowledgeEmbedding"("sourceType", "sourceId", "embeddingModel");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_registrationNumber_key" ON "Industry"("registrationNumber");

-- CreateIndex
CREATE INDEX "Industry_isApproved_idx" ON "Industry"("isApproved");

-- CreateIndex
CREATE INDEX "Industry_state_city_idx" ON "Industry"("state", "city");

-- CreateIndex
CREATE INDEX "IndustryExpertise_name_idx" ON "IndustryExpertise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryExpertise_industryId_name_key" ON "IndustryExpertise"("industryId", "name");

-- CreateIndex
CREATE INDEX "IndustryInterestArea_name_idx" ON "IndustryInterestArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryInterestArea_industryId_name_key" ON "IndustryInterestArea"("industryId", "name");

-- CreateIndex
CREATE INDEX "ProblemUniversityMatch_problemId_decision_idx" ON "ProblemUniversityMatch"("problemId", "decision");

-- CreateIndex
CREATE INDEX "ProblemUniversityMatch_universityId_idx" ON "ProblemUniversityMatch"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemUniversityMatch_problemId_universityId_key" ON "ProblemUniversityMatch"("problemId", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemUniversityMatch_problemId_rank_key" ON "ProblemUniversityMatch"("problemId", "rank");

-- CreateIndex
CREATE INDEX "UniversityProblemAssignment_problemId_status_idx" ON "UniversityProblemAssignment"("problemId", "status");

-- CreateIndex
CREATE INDEX "UniversityProblemAssignment_universityId_status_idx" ON "UniversityProblemAssignment"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityProblemAssignment_problemId_universityId_key" ON "UniversityProblemAssignment"("problemId", "universityId");

-- CreateIndex
CREATE INDEX "ProjectTeam_universityId_idx" ON "ProjectTeam"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTeam_problemId_universityId_key" ON "ProjectTeam"("problemId", "universityId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_memberType_idx" ON "TeamMember"("teamId", "memberType");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_name_memberType_key" ON "TeamMember"("teamId", "name", "memberType");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_teamId_key" ON "Proposal"("teamId");

-- CreateIndex
CREATE INDEX "Proposal_status_createdAt_idx" ON "Proposal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_universityId_idx" ON "Proposal"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_problemId_universityId_key" ON "Proposal"("problemId", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalDocument_storageKey_key" ON "ProposalDocument"("storageKey");

-- CreateIndex
CREATE INDEX "ProposalDocument_proposalId_createdAt_idx" ON "ProposalDocument"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "IndustryProposalInterest_industryId_status_idx" ON "IndustryProposalInterest"("industryId", "status");

-- CreateIndex
CREATE INDEX "IndustryProposalInterest_proposalId_status_idx" ON "IndustryProposalInterest"("proposalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryProposalInterest_proposalId_industryId_key" ON "IndustryProposalInterest"("proposalId", "industryId");

-- CreateIndex
CREATE INDEX "IndustryCollaboration_industryId_status_idx" ON "IndustryCollaboration"("industryId", "status");

-- CreateIndex
CREATE INDEX "IndustryCollaboration_projectId_idx" ON "IndustryCollaboration"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryCollaboration_proposalId_industryId_key" ON "IndustryCollaboration"("proposalId", "industryId");

-- CreateIndex
CREATE INDEX "IndustryFunding_collaborationId_status_idx" ON "IndustryFunding"("collaborationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_status_idx" ON "ProjectMilestone"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMilestone_projectId_sequence_key" ON "ProjectMilestone"("projectId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMilestone_projectId_title_key" ON "ProjectMilestone"("projectId", "title");

-- CreateIndex
CREATE INDEX "ProjectUpdate_projectId_createdAt_idx" ON "ProjectUpdate"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectUpdate_authorUserId_idx" ON "ProjectUpdate"("authorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDocument_storageKey_key" ON "ProjectDocument"("storageKey");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_createdAt_idx" ON "ProjectDocument"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ImpactMeasurement_projectId_measuredAt_idx" ON "ImpactMeasurement"("projectId", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactMeasurement_projectId_metricName_key" ON "ImpactMeasurement"("projectId", "metricName");

-- CreateIndex
CREATE INDEX "RegistrationApplication_status_createdAt_idx" ON "RegistrationApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RegistrationApplication_applicantUserId_idx" ON "RegistrationApplication"("applicantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationApplicationDocument_storageKey_key" ON "RegistrationApplicationDocument"("storageKey");

-- CreateIndex
CREATE INDEX "RegistrationApplicationDocument_applicationId_createdAt_idx" ON "RegistrationApplicationDocument"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx" ON "Notification"("recipientId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitterProfile" ADD CONSTRAINT "SubmitterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "SubmitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProblemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemEvidence" ADD CONSTRAINT "ProblemEvidence_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAIAnalysis" ADD CONSTRAINT "ProblemAIAnalysis_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAIAnalysis" ADD CONSTRAINT "ProblemAIAnalysis_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProblemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatusHistory" ADD CONSTRAINT "ProblemStatusHistory_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatusHistory" ADD CONSTRAINT "ProblemStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "University" ADD CONSTRAINT "University_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityFaculty" ADD CONSTRAINT "UniversityFaculty_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityResearchArea" ADD CONSTRAINT "UniversityResearchArea_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityLab" ADD CONSTRAINT "UniversityLab_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityFacility" ADD CONSTRAINT "UniversityFacility_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityPreviousProject" ADD CONSTRAINT "UniversityPreviousProject_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityKnowledgeEmbedding" ADD CONSTRAINT "UniversityKnowledgeEmbedding_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryExpertise" ADD CONSTRAINT "IndustryExpertise_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryInterestArea" ADD CONSTRAINT "IndustryInterestArea_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemUniversityMatch" ADD CONSTRAINT "ProblemUniversityMatch_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemUniversityMatch" ADD CONSTRAINT "ProblemUniversityMatch_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemUniversityMatch" ADD CONSTRAINT "ProblemUniversityMatch_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemUniversityMatch" ADD CONSTRAINT "ProblemUniversityMatch_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProblemAssignment" ADD CONSTRAINT "UniversityProblemAssignment_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProblemAssignment" ADD CONSTRAINT "UniversityProblemAssignment_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityProblemAssignment" ADD CONSTRAINT "UniversityProblemAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "ProblemUniversityMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeam" ADD CONSTRAINT "ProjectTeam_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTeam" ADD CONSTRAINT "ProjectTeam_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProjectTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProjectTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalDocument" ADD CONSTRAINT "ProposalDocument_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryProposalInterest" ADD CONSTRAINT "IndustryProposalInterest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryProposalInterest" ADD CONSTRAINT "IndustryProposalInterest_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryCollaboration" ADD CONSTRAINT "IndustryCollaboration_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryCollaboration" ADD CONSTRAINT "IndustryCollaboration_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryCollaboration" ADD CONSTRAINT "IndustryCollaboration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryFunding" ADD CONSTRAINT "IndustryFunding_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "IndustryCollaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactMeasurement" ADD CONSTRAINT "ImpactMeasurement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplication" ADD CONSTRAINT "RegistrationApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplication" ADD CONSTRAINT "RegistrationApplication_submitterProfileId_fkey" FOREIGN KEY ("submitterProfileId") REFERENCES "SubmitterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplication" ADD CONSTRAINT "RegistrationApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplication" ADD CONSTRAINT "RegistrationApplication_approvedUniversityId_fkey" FOREIGN KEY ("approvedUniversityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplication" ADD CONSTRAINT "RegistrationApplication_approvedIndustryId_fkey" FOREIGN KEY ("approvedIndustryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationApplicationDocument" ADD CONSTRAINT "RegistrationApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RegistrationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

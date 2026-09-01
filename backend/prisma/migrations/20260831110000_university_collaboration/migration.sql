CREATE TABLE "UniversityProjectContext" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "universityId" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityProjectContext_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectTeam" ADD COLUMN "projectContextId" UUID;

ALTER TABLE "Proposal" ADD COLUMN "projectContextId" UUID;
ALTER TABLE "Proposal" ADD COLUMN "problemUnderstanding" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Proposal" ADD COLUMN "innovation" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "requiredResources" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "estimatedBudget" DECIMAL(14,2);
ALTER TABLE "Proposal" ADD COLUMN "timeline" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "prototypePlan" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "pilotPlan" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "implementationPlan" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "expectedSocialImpact" TEXT;
ALTER TABLE "Proposal" ALTER COLUMN "problemUnderstanding" DROP DEFAULT;

CREATE UNIQUE INDEX "UniversityProjectContext_assignmentId_key" ON "UniversityProjectContext"("assignmentId");
CREATE UNIQUE INDEX "UniversityProjectContext_problemId_universityId_key" ON "UniversityProjectContext"("problemId", "universityId");
CREATE INDEX "UniversityProjectContext_universityId_createdAt_idx" ON "UniversityProjectContext"("universityId", "createdAt");
CREATE UNIQUE INDEX "ProjectTeam_projectContextId_key" ON "ProjectTeam"("projectContextId");
CREATE UNIQUE INDEX "Proposal_projectContextId_key" ON "Proposal"("projectContextId");

ALTER TABLE "UniversityProjectContext"
    ADD CONSTRAINT "UniversityProjectContext_problemId_fkey"
    FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityProjectContext"
    ADD CONSTRAINT "UniversityProjectContext_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UniversityProjectContext"
    ADD CONSTRAINT "UniversityProjectContext_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "UniversityProblemAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectTeam"
    ADD CONSTRAINT "ProjectTeam_projectContextId_fkey"
    FOREIGN KEY ("projectContextId") REFERENCES "UniversityProjectContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Proposal"
    ADD CONSTRAINT "Proposal_projectContextId_fkey"
    FOREIGN KEY ("projectContextId") REFERENCES "UniversityProjectContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectDocumentType" ADD VALUE 'TECHNICAL_DOCUMENT';
ALTER TYPE "ProjectDocumentType" ADD VALUE 'TEST_REPORT';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'COLLABORATION_CONFIRMED';

-- AlterTable
ALTER TABLE "ImpactMeasurement" ADD COLUMN     "evidence" TEXT,
ADD COLUMN     "locationsCovered" INTEGER,
ADD COLUMN     "peopleBenefited" INTEGER;

-- Keep the historical optional-array default cleanup safe during shadow replay.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'ProblemAIAnalysis'
          AND column_name = 'potentialSolutionAreas'
    ) THEN
        ALTER TABLE "ProblemAIAnalysis" ALTER COLUMN "potentialSolutionAreas" DROP DEFAULT;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "ProjectDocument" ADD COLUMN     "updateId" UUID;

-- AlterTable
ALTER TABLE "ProjectMilestone" ADD COLUMN     "completionPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dueDate" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "ProjectUpdate" ADD COLUMN     "milestoneId" UUID,
ADD COLUMN     "progressPercentage" INTEGER;

-- CreateTable
CREATE TABLE "ProjectStatusHistory" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "actorUserId" UUID,
    "oldStatus" "ProjectStatus",
    "newStatus" "ProjectStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectStatusHistory_projectId_createdAt_idx" ON "ProjectStatusHistory"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectStatusHistory_actorUserId_idx" ON "ProjectStatusHistory"("actorUserId");

-- CreateIndex
CREATE INDEX "ProjectDocument_updateId_idx" ON "ProjectDocument"("updateId");

-- CreateIndex
CREATE INDEX "ProjectUpdate_milestoneId_idx" ON "ProjectUpdate"("milestoneId");

-- AddForeignKey
ALTER TABLE "ProjectStatusHistory" ADD CONSTRAINT "ProjectStatusHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatusHistory" ADD CONSTRAINT "ProjectStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "ProjectUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prisma cannot represent the pgvector indexes; they are owned by the
-- semantic-matching migration and remain outside the Prisma schema model.
ALTER TABLE "ProjectMilestone"
    ADD CONSTRAINT "ProjectMilestone_completionPercentage_range"
    CHECK ("completionPercentage" BETWEEN 0 AND 100);
ALTER TABLE "ProjectUpdate"
    ADD CONSTRAINT "ProjectUpdate_progressPercentage_range"
    CHECK ("progressPercentage" IS NULL OR "progressPercentage" BETWEEN 0 AND 100);
ALTER TABLE "ImpactMeasurement"
    ADD CONSTRAINT "ImpactMeasurement_peopleBenefited_nonnegative"
    CHECK ("peopleBenefited" IS NULL OR "peopleBenefited" >= 0),
    ADD CONSTRAINT "ImpactMeasurement_locationsCovered_nonnegative"
    CHECK ("locationsCovered" IS NULL OR "locationsCovered" >= 0);

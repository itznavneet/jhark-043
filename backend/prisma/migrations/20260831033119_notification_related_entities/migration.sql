-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedEntityId" UUID,
ADD COLUMN     "relatedEntityType" VARCHAR(80);

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

-- CreateIndex
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "Notification"("relatedEntityType", "relatedEntityId");

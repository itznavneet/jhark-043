CREATE TYPE "AiProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "ProblemAIAnalysis"
ADD COLUMN "processingStatus" "AiProcessingStatus",
ADD COLUMN "reason" TEXT,
ADD COLUMN "potentialSolutionAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "failureReason" TEXT,
ADD COLUMN "processedAt" TIMESTAMPTZ(6);

UPDATE "ProblemAIAnalysis"
SET "processingStatus" = 'COMPLETED'
WHERE "processingStatus" IS NULL;

ALTER TABLE "ProblemAIAnalysis"
ALTER COLUMN "processingStatus" SET DEFAULT 'PENDING',
ALTER COLUMN "processingStatus" SET NOT NULL,
ALTER COLUMN "validationDecision" DROP NOT NULL,
ALTER COLUMN "isSocietalProblem" DROP NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL;

CREATE INDEX "ProblemAIAnalysis_processingStatus_idx"
ON "ProblemAIAnalysis"("processingStatus");

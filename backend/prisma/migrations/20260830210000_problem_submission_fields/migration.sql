ALTER TABLE "Problem"
ADD COLUMN "district" VARCHAR(160),
ADD COLUMN "block" VARCHAR(160),
ADD COLUMN "villageLocality" VARCHAR(255),
ADD COLUMN "latitude" DECIMAL(9, 6),
ADD COLUMN "longitude" DECIMAL(9, 6),
ADD COLUMN "priority" "ProblemPriority",
ADD COLUMN "supportingInformation" TEXT;

CREATE INDEX "Problem_district_block_idx" ON "Problem"("district", "block");
CREATE INDEX "Problem_priority_idx" ON "Problem"("priority");

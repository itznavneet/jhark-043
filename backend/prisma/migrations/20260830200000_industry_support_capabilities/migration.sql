CREATE TABLE "IndustrySupportCapability" (
    "id" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "IndustrySupportCapability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndustrySupportCapability_industryId_name_key"
ON "IndustrySupportCapability"("industryId", "name");

CREATE INDEX "IndustrySupportCapability_name_idx"
ON "IndustrySupportCapability"("name");

ALTER TABLE "IndustrySupportCapability"
ADD CONSTRAINT "IndustrySupportCapability_industryId_fkey"
FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

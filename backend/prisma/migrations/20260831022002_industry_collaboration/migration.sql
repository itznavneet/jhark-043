/*
  Warnings:

  - Added the required column `supportType` to the `IndustryCollaboration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supportType` to the `IndustryProposalInterest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IndustrySupportType" AS ENUM ('FUNDING', 'MENTORSHIP', 'TECHNICAL_SUPPORT', 'INFRASTRUCTURE', 'PILOT_SUPPORT', 'OTHER');

-- AlterTable
ALTER TABLE "IndustryCollaboration" ADD COLUMN     "supportType" "IndustrySupportType" NOT NULL;

-- AlterTable
ALTER TABLE "IndustryFunding" ADD COLUMN     "conditionsNotes" TEXT;

-- AlterTable
ALTER TABLE "IndustryProposalInterest" ADD COLUMN     "supportType" "IndustrySupportType" NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "industryId" UUID;

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "requestedSupportTypes" "IndustrySupportType"[] DEFAULT ARRAY[]::"IndustrySupportType"[];

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one industry may accept/confirm a proposal.
CREATE UNIQUE INDEX "IndustryCollaboration_one_active_per_proposal_idx"
    ON "IndustryCollaboration" ("proposalId")
    WHERE "status" IN ('ACCEPTED', 'CONFIRMED');

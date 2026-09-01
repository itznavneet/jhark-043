-- Phase 12: deduplicated industry proposal-detail view events for analytics.
CREATE TABLE "IndustryProposalView" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "industryId" UUID NOT NULL,
    "viewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryProposalView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IndustryProposalView_proposalId_industryId_key"
    ON "IndustryProposalView"("proposalId", "industryId");
CREATE INDEX "IndustryProposalView_industryId_viewedAt_idx"
    ON "IndustryProposalView"("industryId", "viewedAt");
CREATE INDEX "IndustryProposalView_proposalId_viewedAt_idx"
    ON "IndustryProposalView"("proposalId", "viewedAt");

ALTER TABLE "IndustryProposalView"
    ADD CONSTRAINT "IndustryProposalView_proposalId_fkey"
    FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndustryProposalView"
    ADD CONSTRAINT "IndustryProposalView_industryId_fkey"
    FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

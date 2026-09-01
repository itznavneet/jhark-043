-- Phase 7: problem embeddings, matching attempts, and recommendation provenance.
CREATE TYPE "MatchingProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "ProblemEmbedding" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "contentText" TEXT NOT NULL,
    "embedding" vector(1536),
    "embeddingModel" VARCHAR(120) NOT NULL,
    "dimensions" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProblemEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UniversityMatchingRun" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "processingStatus" "MatchingProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "embeddingModel" VARCHAR(120) NOT NULL,
    "rankingModel" VARCHAR(120) NOT NULL,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "processedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UniversityMatchingRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProblemUniversityMatch"
    ADD COLUMN "matchingRunId" UUID,
    ADD COLUMN "generatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "UniversityKnowledgeEmbedding"
    ALTER COLUMN "embedding" TYPE vector(1536)
    USING "embedding"::vector(1536);

DROP INDEX "ProblemUniversityMatch_problemId_rank_key";

CREATE UNIQUE INDEX "ProblemEmbedding_problemId_embeddingModel_key"
    ON "ProblemEmbedding"("problemId", "embeddingModel");
CREATE INDEX "ProblemEmbedding_problemId_createdAt_idx"
    ON "ProblemEmbedding"("problemId", "createdAt");
CREATE INDEX "UniversityMatchingRun_problemId_createdAt_idx"
    ON "UniversityMatchingRun"("problemId", "createdAt");
CREATE INDEX "UniversityMatchingRun_processingStatus_idx"
    ON "UniversityMatchingRun"("processingStatus");
CREATE INDEX "ProblemUniversityMatch_matchingRunId_rank_idx"
    ON "ProblemUniversityMatch"("matchingRunId", "rank");
CREATE INDEX "UniversityKnowledgeEmbedding_embedding_hnsw_idx"
    ON "UniversityKnowledgeEmbedding" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "ProblemEmbedding_embedding_hnsw_idx"
    ON "ProblemEmbedding" USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "ProblemEmbedding"
    ADD CONSTRAINT "ProblemEmbedding_problemId_fkey"
    FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UniversityMatchingRun"
    ADD CONSTRAINT "UniversityMatchingRun_problemId_fkey"
    FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProblemUniversityMatch"
    ADD CONSTRAINT "ProblemUniversityMatch_matchingRunId_fkey"
    FOREIGN KEY ("matchingRunId") REFERENCES "UniversityMatchingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

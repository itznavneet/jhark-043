-- CreateTable
CREATE TABLE "ProblemUpvote" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemUpvote_problemId_userId_key" ON "ProblemUpvote"("problemId", "userId");
CREATE INDEX "ProblemUpvote_problemId_createdAt_idx" ON "ProblemUpvote"("problemId", "createdAt");
CREATE INDEX "ProblemUpvote_userId_createdAt_idx" ON "ProblemUpvote"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProblemUpvote" ADD CONSTRAINT "ProblemUpvote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemUpvote" ADD CONSTRAINT "ProblemUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

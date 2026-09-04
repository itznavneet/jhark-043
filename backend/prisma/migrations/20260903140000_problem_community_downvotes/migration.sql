-- CreateTable
CREATE TABLE "ProblemDownvote" (
    "id" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemDownvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemDownvote_problemId_userId_key" ON "ProblemDownvote"("problemId", "userId");
CREATE INDEX "ProblemDownvote_problemId_createdAt_idx" ON "ProblemDownvote"("problemId", "createdAt");
CREATE INDEX "ProblemDownvote_userId_createdAt_idx" ON "ProblemDownvote"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProblemDownvote" ADD CONSTRAINT "ProblemDownvote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProblemDownvote" ADD CONSTRAINT "ProblemDownvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

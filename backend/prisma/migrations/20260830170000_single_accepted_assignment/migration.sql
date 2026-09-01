-- Prisma does not currently model partial unique indexes in schema.prisma.
-- This prevents concurrent acceptance from creating two accepted universities
-- for the same problem while allowing multiple pending/cancelled assignments.
CREATE UNIQUE INDEX "UniversityProblemAssignment_one_accepted_per_problem_idx"
ON "UniversityProblemAssignment" ("problemId")
WHERE "status" = 'ACCEPTED';

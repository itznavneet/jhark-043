import { randomUUID } from "node:crypto";
import { PrismaClient, ProblemStatus, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { UniversityAssignmentRepository } from "./university-assignment.repository.js";

const runIntegrationTests =
  process.env.RUN_COLLABORATION_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)(
  "university assignment PostgreSQL integration",
  () => {
    it("allows only one concurrent acceptance and cancels the other invitation", async () => {
      const client = new PrismaClient();
      const suffix = randomUUID().slice(0, 8);
      let problemId: string | undefined;
      const universityIds: string[] = [];
      const userIds: string[] = [];

      try {
        const submitter = await client.user.create({
          data: {
            email: `phase8-submit-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.SUBMITTER,
            displayName: "Phase 8 Integration Submitter",
            submitterProfile: {
              create: {
                type: "CITIZEN",
                displayName: "Phase 8 Integration Submitter",
              },
            },
          },
          include: { submitterProfile: true },
        });
        const problem = await client.problem.create({
          data: {
            submitterId: submitter.submitterProfile!.id,
            title: `Concurrent acceptance ${suffix}`,
            description:
              "Synthetic integration problem for university acceptance.",
            currentStatus: ProblemStatus.INVITATIONS_SENT,
            statusHistory: {
              create: [
                {
                  newStatus: ProblemStatus.SUBMITTED,
                  reason: "Integration fixture",
                },
                {
                  oldStatus: ProblemStatus.SUBMITTED,
                  newStatus: ProblemStatus.INVITATIONS_SENT,
                  reason: "Integration fixture",
                },
              ],
            },
          },
        });
        problemId = problem.id;

        const fixtures = await Promise.all(
          ["A", "B"].map(async (label) => {
            const university = await client.university.create({
              data: {
                name: `Phase 8 Integration University ${suffix}-${label}`,
                shortName: `P8-${suffix}-${label}`,
                isApproved: true,
                users: {
                  create: {
                    email: `phase8-university-${suffix}-${label}@example.test`,
                    passwordHash: "integration-test-hash",
                    role: UserRole.UNIVERSITY,
                    displayName: `Phase 8 University ${label}`,
                  },
                },
              },
              include: { users: true },
            });
            return { university, userId: university.users[0]!.id };
          }),
        );
        universityIds.push(...fixtures.map(({ university }) => university.id));
        userIds.push(...fixtures.map(({ userId }) => userId));
        const assignments = await Promise.all(
          fixtures.map(({ university }) =>
            client.universityProblemAssignment.create({
              data: {
                problemId: problem.id,
                universityId: university.id,
                status: "INVITED",
                invitedAt: new Date(),
              },
            }),
          ),
        );

        const repository = new UniversityAssignmentRepository(client);
        const results = await Promise.allSettled(
          assignments.map((assignment, index) =>
            repository.acceptForUniversity(userIds[index]!, assignment.id),
          ),
        );

        expect(
          results.filter((result) => result.status === "fulfilled"),
        ).toHaveLength(1);
        expect(
          results.filter((result) => result.status === "rejected"),
        ).toHaveLength(1);
        expect(
          await client.universityProblemAssignment.count({
            where: { problemId: problem.id, status: "ACCEPTED" },
          }),
        ).toBe(1);
        expect(
          await client.universityProblemAssignment.count({
            where: { problemId: problem.id, status: "CANCELLED" },
          }),
        ).toBe(1);
        expect(
          await client.universityProjectContext.count({
            where: { problemId: problem.id },
          }),
        ).toBe(1);
        expect(
          await client.problemStatusHistory.count({
            where: {
              problemId: problem.id,
              newStatus: ProblemStatus.UNIVERSITY_ACCEPTED,
            },
          }),
        ).toBe(1);
      } finally {
        if (problemId)
          await client.problem.delete({ where: { id: problemId } });
        if (userIds.length)
          await client.user.deleteMany({ where: { id: { in: userIds } } });
        if (universityIds.length)
          await client.university.deleteMany({
            where: { id: { in: universityIds } },
          });
        await client.$disconnect();
      }
    });
  },
);

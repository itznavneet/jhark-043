import { randomUUID } from "node:crypto";
import { PrismaClient, ProblemStatus, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { CommunityRepository } from "./community.repository.js";

const runIntegrationTests = process.env.RUN_COMMUNITY_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)("community upvote integration", () => {
  it("prevents self/duplicate support and sends a validated problem to Ministry at the threshold", async () => {
    const client = new PrismaClient();
    const suffix = randomUUID().slice(0, 8);
    const userIds: string[] = [];
    let problemId: string | undefined;
    try {
      const users = await Promise.all(
        ["owner", "supporter-one", "supporter-two", "supporter-three"].map(
          (label) =>
            client.user.create({
              data: {
                email: `phase15-${label}-${suffix}@example.test`,
                passwordHash: "integration-test-hash",
                role: UserRole.SUBMITTER,
                displayName: label,
                submitterProfile: {
                  create: { type: "CITIZEN", displayName: label },
                },
              },
            }),
        ),
      );
      userIds.push(...users.map((user) => user.id));
      const ministry = await client.user.create({
        data: {
          email: `phase15-ministry-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.MINISTRY_ADMIN,
          displayName: "integration ministry",
        },
      });
      userIds.push(ministry.id);
      const category = await client.problemCategory.create({
        data: { name: `Phase 15 community ${suffix}` },
      });
      const ownerProfile = await client.submitterProfile.findUniqueOrThrow({
        where: { userId: users[0]!.id },
      });
      const problem = await client.problem.create({
        data: {
          submitterId: ownerProfile.id,
          categoryId: category.id,
          title: `Community challenge ${suffix}`,
          description:
            "A validated community challenge with broad public impact.",
          currentStatus: ProblemStatus.AI_VALIDATED,
          statusHistory: {
            create: {
              oldStatus: ProblemStatus.SUBMITTED,
              newStatus: ProblemStatus.AI_VALIDATED,
              reason: "AI validated",
            },
          },
        },
      });
      problemId = problem.id;
      const repository = new CommunityRepository(client);
      await expect(
        repository.upvote(problem.id, users[0]!.id, 2),
      ).rejects.toMatchObject({
        code: "OWN_PROBLEM_UPVOTE_FORBIDDEN",
      });
      const downvoted = await repository.downvote(problem.id, users[1]!.id, 2);
      expect(downvoted._count.downvotes).toBe(1);
      await expect(
        repository.upvote(problem.id, users[1]!.id, 2),
      ).rejects.toMatchObject({
        code: "DUPLICATE_PROBLEM_VOTE",
      });
      await repository.upvote(problem.id, users[2]!.id, 2);
      await expect(
        repository.upvote(problem.id, users[2]!.id, 2),
      ).rejects.toMatchObject({
        code: "DUPLICATE_PROBLEM_UPVOTE",
      });
      const result = await repository.upvote(problem.id, users[3]!.id, 2);
      expect(result.currentStatus).toBe(ProblemStatus.MINISTRY_REVIEW);
      expect(result._count.upvotes).toBe(2);
      expect(
        await client.problemStatusHistory.count({
          where: {
            problemId: problem.id,
            newStatus: ProblemStatus.MINISTRY_REVIEW,
          },
        }),
      ).toBe(1);
    } finally {
      if (problemId) await client.problem.delete({ where: { id: problemId } });
      if (userIds.length)
        await client.user.deleteMany({ where: { id: { in: userIds } } });
      await client.$disconnect();
    }
  });
});

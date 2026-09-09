import { randomUUID } from "node:crypto";
import { PrismaClient, ProblemStatus, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { AnalyticsRepository } from "./analytics.repository.js";

const runIntegrationTests = process.env.RUN_ANALYTICS_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)("analytics category aggregation", () => {
  it("maps eligible problems to primary categories and excludes rejected submissions", async () => {
    const client = new PrismaClient();
    const suffix = randomUUID().slice(0, 8);
    let userId: string | undefined;
    const problemIds: string[] = [];
    const categoryIds: string[] = [];

    try {
      const user = await client.user.create({
        data: {
          email: `analytics-category-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.SUBMITTER,
          displayName: "Analytics category tester",
          submitterProfile: {
            create: {
              type: "CITIZEN",
              displayName: "Analytics category tester",
            },
          },
        },
      });
      userId = user.id;
      const profile = await client.submitterProfile.findUniqueOrThrow({
        where: { userId: user.id },
      });
      const [validCategory, rejectedCategory] = await Promise.all([
        client.problemCategory.create({
          data: { name: `Water and Sanitation ${suffix}` },
        }),
        client.problemCategory.create({
          data: { name: `Family Problem ${suffix}` },
        }),
      ]);
      categoryIds.push(validCategory.id, rejectedCategory.id);

      const valid = await client.problem.create({
        data: {
          submitterId: profile.id,
          categoryId: validCategory.id,
          title: `Rural drinking water monitoring ${suffix}`,
          description:
            "Rural villages need reliable drinking water quality monitoring and timely alerts for unsafe sources.",
          currentStatus: ProblemStatus.AI_VALIDATED,
        },
      });
      const rejected = await client.problem.create({
        data: {
          submitterId: profile.id,
          categoryId: rejectedCategory.id,
          title: `Personal family request ${suffix}`,
          description:
            "This is a private family matter and not a community challenge.",
          currentStatus: ProblemStatus.AI_REJECTED,
        },
      });
      problemIds.push(valid.id, rejected.id);

      const categories = await new AnalyticsRepository(
        client,
      ).getProblemsByCategory();

      expect(categories).toContainEqual({
        label: "Water Management",
        value: 1,
      });
      expect(
        categories.some((item) => item.label.includes("Family Problem")),
      ).toBe(false);
    } finally {
      if (problemIds.length)
        await client.problem.deleteMany({ where: { id: { in: problemIds } } });
      if (categoryIds.length)
        await client.problemCategory.deleteMany({
          where: { id: { in: categoryIds } },
        });
      if (userId) await client.user.delete({ where: { id: userId } });
      await client.$disconnect();
    }
  });
});

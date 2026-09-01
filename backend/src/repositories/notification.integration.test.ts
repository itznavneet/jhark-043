import { randomUUID } from "node:crypto";
import { PrismaClient, ProblemStatus, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { NotificationRepository } from "./notification.repository.js";
import { ProblemRepository } from "./problem.repository.js";

const runIntegrationTests = process.env.RUN_NOTIFICATION_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)(
  "notification PostgreSQL integration",
  () => {
    it("creates event notifications and isolates recipient access", async () => {
      const client = new PrismaClient();
      const suffix = randomUUID().slice(0, 8);
      let problemId: string | undefined;
      const userIds: string[] = [];

      try {
        const ministry = await client.user.create({
          data: {
            email: `phase11-ministry-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.MINISTRY_ADMIN,
            displayName: "Phase 11 Ministry",
          },
        });
        const submitter = await client.user.create({
          data: {
            email: `phase11-submitter-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.SUBMITTER,
            displayName: "Phase 11 Submitter",
            submitterProfile: {
              create: { type: "CITIZEN", displayName: "Phase 11 Submitter" },
            },
          },
        });
        const otherSubmitter = await client.user.create({
          data: {
            email: `phase11-other-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.SUBMITTER,
            displayName: "Phase 11 Other Submitter",
            submitterProfile: {
              create: {
                type: "CITIZEN",
                displayName: "Phase 11 Other Submitter",
              },
            },
          },
        });
        userIds.push(ministry.id, submitter.id, otherSubmitter.id);

        const problem = await new ProblemRepository(client).createProblem(
          submitter.id,
          {
            title: `Community drainage monitoring ${suffix}`,
            description:
              "A community needs a reliable way to monitor drainage blockages.",
            category: "Civic technology",
            evidence: [],
          },
        );
        problemId = problem.id;

        const notifications = new NotificationRepository(client);
        expect(await notifications.countUnread(submitter.id)).toBe(1);
        expect(await notifications.countUnread(ministry.id)).toBe(1);
        expect(
          await notifications.listForRecipient(otherSubmitter.id),
        ).toHaveLength(0);

        await new ProblemRepository(client).transitionProblem(
          problem.id,
          ministry.id,
          "MINISTRY_ADMIN",
          ProblemStatus.MINISTRY_REVIEW,
          "Ready for Ministry review",
        );
        expect(await notifications.countUnread(submitter.id)).toBe(2);

        const ownNotification = (
          await notifications.listForRecipient(submitter.id)
        )[0]!;
        await expect(
          notifications.markRead(ownNotification.id, otherSubmitter.id),
        ).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
        await notifications.markRead(ownNotification.id, submitter.id);
        expect(await notifications.countUnread(submitter.id)).toBe(1);
        expect((await notifications.markAllRead(submitter.id)).count).toBe(1);
        expect(await notifications.countUnread(submitter.id)).toBe(0);
      } finally {
        if (problemId)
          await client.problem.delete({ where: { id: problemId } });
        if (userIds.length)
          await client.user.deleteMany({ where: { id: { in: userIds } } });
        await client.$disconnect();
      }
    });
  },
);

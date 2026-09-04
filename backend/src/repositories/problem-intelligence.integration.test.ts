import { randomUUID } from "node:crypto";
import { PrismaClient, ProblemStatus, UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { DevelopmentEmbeddingProvider } from "../ai/developmentEmbedding.provider.js";
import { DevelopmentProblemAnalysisProvider } from "../ai/developmentProblemAnalysis.provider.js";
import { CommunityRepository } from "./community.repository.js";
import { ProblemAiRepository } from "./problem-ai.repository.js";
import { ProblemRepository } from "./problem.repository.js";
import { SemanticProblemDuplicateService } from "../services/problemDuplicate.service.js";
import { ProblemAiService } from "../services/problemAi.service.js";
import { UniversityMatchingRepository } from "./university-matching.repository.js";

const runIntegrationTests =
  process.env.RUN_PROBLEM_INTELLIGENCE_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)("problem AI submission gate", () => {
  it("evaluates the complete submission and rejects personal content", async () => {
    const client = new PrismaClient();
    const suffix = randomUUID().slice(0, 8);
    const user = await client.user.create({
      data: {
        email: `phase15-intelligence-${suffix}@example.test`,
        passwordHash: "integration-test-hash",
        role: UserRole.SUBMITTER,
        displayName: "Problem intelligence tester",
        submitterProfile: {
          create: {
            type: "CITIZEN",
            displayName: "Problem intelligence tester",
          },
        },
      },
    });
    const problemRepository = new ProblemRepository(client);
    const aiService = createAiService(client);
    const createdProblemIds: string[] = [];
    try {
      const valid = await problemRepository.createProblem(user.id, {
        title: "Unsafe Drinking Water in Rural Villages",
        description:
          "Several rural villages rely on hand pumps and local water sources, but there is no regular monitoring of drinking-water quality. Residents may continue using contaminated sources because local authorities do not receive timely information about changes in water quality.",
        category: "Water and sanitation",
        location: "Jharkhand",
        district: "Ranchi",
        block: "Kanke",
        evidence: [],
      });
      createdProblemIds.push(valid.id);
      const validAnalysis = await aiService.processSubmittedProblem(valid.id);
      expect(validAnalysis.validationDecision).toBe("VALIDATED");
      expect(
        (
          await problemRepository.findProblemById(valid.id, {
            submitterUserId: user.id,
          })
        )?.currentStatus,
      ).toBe(ProblemStatus.AI_VALIDATED);

      const personal = await createProblem(problemRepository, user.id, {
        title: "My Friend Is Teasing Me",
        description: "My friend keeps teasing me and I do not know what to do.",
        category: "Water and sanitation",
      });
      createdProblemIds.push(personal.id);
      const personalAnalysis = await aiService.processSubmittedProblem(
        personal.id,
      );
      expect(personalAnalysis.validationDecision).toBe("REJECTED_IRRELEVANT");
      expect(
        (
          await problemRepository.findProblemById(personal.id, {
            submitterUserId: user.id,
          })
        )?.currentStatus,
      ).toBe(ProblemStatus.AI_REJECTED);

      const misleading = await createProblem(problemRepository, user.id, {
        title: "Improving Rural Education",
        description:
          "My friend is not talking to me and I am having problems with my family.",
        category: "Education",
      });
      createdProblemIds.push(misleading.id);
      const misleadingAnalysis = await aiService.processSubmittedProblem(
        misleading.id,
      );
      expect(misleadingAnalysis.validationDecision).toBe("REJECTED_IRRELEVANT");

      const different = await createProblem(problemRepository, user.id, {
        title: "Rural Sanitation Access",
        description:
          "Several villages lack safe sanitation facilities and residents need an affordable community-led solution for waste management and hygiene improvement.",
        category: "Water and sanitation",
      });
      createdProblemIds.push(different.id);
      expect(
        (await aiService.processSubmittedProblem(different.id))
          .validationDecision,
      ).toBe("VALIDATED");

      const community = await new CommunityRepository(
        client,
      ).listValidatedProblems(user.id);
      expect(community.map((item) => item.id)).toEqual(
        expect.arrayContaining([valid.id, different.id]),
      );
      expect(community.map((item) => item.id)).not.toEqual(
        expect.arrayContaining([personal.id, misleading.id]),
      );
    } finally {
      await client.problem.deleteMany({
        where: { id: { in: createdProblemIds } },
      });
      await client.user.delete({ where: { id: user.id } });
      await client.$disconnect();
    }
  });

  it("rejects a semantically duplicate problem with a persisted duplicate decision", async () => {
    const client = new PrismaClient();
    const suffix = randomUUID().slice(0, 8);
    const user = await client.user.create({
      data: {
        email: `phase15-duplicate-${suffix}@example.test`,
        passwordHash: "integration-test-hash",
        role: UserRole.SUBMITTER,
        displayName: "Duplicate tester",
        submitterProfile: {
          create: { type: "CITIZEN", displayName: "Duplicate tester" },
        },
      },
    });
    const problemRepository = new ProblemRepository(client);
    const aiService = createAiService(client);
    const createdProblemIds: string[] = [];
    try {
      const original = await createProblem(problemRepository, user.id, {
        title:
          "Real-Time Drinking Water Quality Monitoring for Rural Communities",
        description:
          "Rural communities depend on groundwater sources such as hand pumps and borewells for drinking water. Water quality is usually checked periodically, making it difficult for authorities to detect sudden changes. A low-cost monitoring system is needed to continuously measure water quality, maintain historical records, identify abnormal readings and alert responsible authorities.",
        category: "Water and sanitation",
      });
      createdProblemIds.push(original.id);
      expect(
        (await aiService.processSubmittedProblem(original.id))
          .validationDecision,
      ).toBe("VALIDATED");

      const duplicate = await createProblem(problemRepository, user.id, {
        title: "Monitoring Water Quality in Rural Drinking Water Sources",
        description:
          "Villages often depend on hand pumps and borewells, but water quality is not continuously monitored. Authorities may not know quickly when a drinking-water source becomes unsafe. A technology-based system could monitor water quality, detect abnormal readings and notify officials.",
        category: "Water and sanitation",
      });
      createdProblemIds.push(duplicate.id);
      const duplicateAnalysis = await aiService.processSubmittedProblem(
        duplicate.id,
      );
      expect(duplicateAnalysis.validationDecision).toBe("REJECTED_DUPLICATE");
      expect(duplicateAnalysis.reason).toContain(original.title);
      expect(
        (
          await problemRepository.findProblemById(duplicate.id, {
            submitterUserId: user.id,
          })
        )?.currentStatus,
      ).toBe(ProblemStatus.AI_REJECTED);
      expect(
        (
          await new CommunityRepository(client).listValidatedProblems(user.id)
        ).map((item) => item.id),
      ).not.toContain(duplicate.id);
    } finally {
      await client.problem.deleteMany({
        where: { id: { in: createdProblemIds } },
      });
      await client.user.delete({ where: { id: user.id } });
      await client.$disconnect();
    }
  });
});

function createAiService(client: PrismaClient) {
  return new ProblemAiService(
    new ProblemAiRepository(client),
    new DevelopmentProblemAnalysisProvider(),
    new SemanticProblemDuplicateService(
      new UniversityMatchingRepository(client),
      new DevelopmentEmbeddingProvider(),
    ),
  );
}

async function createProblem(
  repository: ProblemRepository,
  userId: string,
  input: { title: string; description: string; category: string },
) {
  return repository.createProblem(userId, {
    ...input,
    location: "Jharkhand",
    district: "Ranchi",
    evidence: [],
  });
}

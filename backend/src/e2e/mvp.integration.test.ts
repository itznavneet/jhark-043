import { randomUUID } from "node:crypto";
import {
  PrismaClient,
  ProblemStatus,
  ProjectStatus,
  UserRole,
} from "@prisma/client";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { DevelopmentUniversityRankingProvider } from "../ai/developmentUniversityRanking.provider.js";
import { ProblemAiRepository } from "../repositories/problem-ai.repository.js";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { ProjectRepository } from "../repositories/project.repository.js";
import { ProposalRepository } from "../repositories/proposal.repository.js";
import { UniversityAssignmentRepository } from "../repositories/university-assignment.repository.js";
import { UniversityMatchingRepository } from "../repositories/university-matching.repository.js";
import { UniversityTeamRepository } from "../repositories/university-team.repository.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { createApp } from "../app.js";
import type { AppEnvironment } from "../config/environment.js";
import { ProblemAiService } from "../services/problemAi.service.js";
import { IndustryCollaborationService } from "../services/industryCollaboration.service.js";
import { ProjectService } from "../services/project.service.js";
import { UniversityCollaborationService } from "../services/universityCollaboration.service.js";
import { UniversityMatchingService } from "../services/universityMatching.service.js";
import { TokenService } from "../services/token.service.js";
import type { EmbeddingProvider } from "../types/matching.js";

const runIntegrationTests = process.env.RUN_E2E_INTEGRATION === "true";
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/test";

const testEnvironment: AppEnvironment = {
  nodeEnv: "test",
  port: 4000,
  databaseUrl,
  jwtSecret: "phase-13-test-secret-that-is-at-least-32-chars",
  frontendUrl: "http://localhost:3000",
  requestBodyLimit: "1mb",
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 30,
  openAiModel: "test-model",
  matchingEmbeddingModel: "test-embedding-model",
  matchingRankingModel: "test-ranking-model",
};

class Phase13EmbeddingProvider implements EmbeddingProvider {
  readonly modelName = "phase13-deterministic-embedding";

  async createEmbedding(text: string) {
    const isFixtureKnowledge = text.includes("PHASE13_MATCH_MARKER");
    const vector = Array.from({ length: 1536 }, (_, index) =>
      isFixtureKnowledge ? 1 : index === 0 ? 1 : 0,
    );
    return { vector, modelName: this.modelName, dimensions: vector.length };
  }
}

describe.skipIf(!runIntegrationTests)("Phase 13 MVP journey", () => {
  it("verifies the problem-to-impact journey, security boundaries, and analytics", async () => {
    const client = new PrismaClient();
    const analyticsRepository = new AnalyticsRepository(client);
    const suffix = randomUUID().slice(0, 8);
    const userIds: string[] = [];
    const universityIds: string[] = [];
    const industryIds: string[] = [];
    let problemId: string | undefined;
    let projectId: string | undefined;

    try {
      const ministry = await client.user.create({
        data: {
          email: `phase13-ministry-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.MINISTRY_ADMIN,
          displayName: "Phase 13 Ministry",
        },
      });
      userIds.push(ministry.id);

      const submitter = await client.user.create({
        data: {
          email: `phase13-submitter-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.SUBMITTER,
          displayName: "Phase 13 Submitter",
          submitterProfile: {
            create: {
              type: "CITIZEN",
              displayName: "Phase 13 Submitter",
            },
          },
        },
        include: { submitterProfile: true },
      });
      userIds.push(submitter.id);

      const otherSubmitter = await client.user.create({
        data: {
          email: `phase13-other-submitter-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.SUBMITTER,
          displayName: "Phase 13 Other Submitter",
          submitterProfile: {
            create: {
              type: "ORGANIZATION",
              displayName: "Phase 13 Other Submitter",
            },
          },
        },
      });
      userIds.push(otherSubmitter.id);

      const industry = await client.industry.create({
        data: {
          name: `Phase 13 Industry ${suffix}`,
          description: "Synthetic industry support partner.",
          isApproved: true,
        },
      });
      industryIds.push(industry.id);
      const industryUser = await client.user.create({
        data: {
          email: `phase13-industry-${suffix}@example.test`,
          passwordHash: "integration-test-hash",
          role: UserRole.INDUSTRY,
          displayName: "Phase 13 Industry User",
          industryId: industry.id,
        },
      });
      userIds.push(industryUser.id);

      const universityFixtures = await Promise.all(
        ["A", "B", "C"].map(async (label) => {
          const university = await client.university.create({
            data: {
              name: `Phase 13 University ${label} ${suffix}`,
              shortName: `P13-${suffix}-${label}`,
              description:
                "PHASE13_MATCH_MARKER university for community water monitoring and rural field innovation.",
              city: "Ranchi",
              state: "Jharkhand",
              isApproved: true,
              researchAreas: {
                create: {
                  name: "Community water monitoring",
                  description: "PHASE13_MATCH_MARKER sensors and field systems",
                },
              },
              faculty: {
                create: {
                  name: `Phase 13 Faculty ${label}`,
                  title: "Associate Professor",
                  department: "Engineering",
                  researchFocus: "PHASE13_MATCH_MARKER rural IoT systems",
                },
              },
              labs: {
                create: {
                  name: `Phase 13 Field Lab ${label}`,
                  description: "PHASE13_MATCH_MARKER field testing laboratory",
                  capabilities: ["water sensors", "rural deployment"],
                },
              },
              facilities: {
                create: {
                  name: `Phase 13 Innovation Facility ${label}`,
                  type: "FIELD_SITE",
                  description: "PHASE13_MATCH_MARKER community field facility",
                  capabilities: ["pilot testing"],
                },
              },
              previousProjects: {
                create: {
                  title: `Phase 13 Water Pilot ${label}`,
                  summary:
                    "PHASE13_MATCH_MARKER village water monitoring pilot",
                  domains: ["water", "IoT"],
                  outcomes: "Improved maintenance response",
                },
              },
            },
          });
          universityIds.push(university.id);
          const user = await client.user.create({
            data: {
              email: `phase13-university-${suffix}-${label}@example.test`,
              passwordHash: "integration-test-hash",
              role: UserRole.UNIVERSITY,
              displayName: `Phase 13 University ${label} User`,
              universityId: university.id,
            },
          });
          userIds.push(user.id);
          return { university, user };
        }),
      );

      const problemRepository = new ProblemRepository(client);
      const problem = await problemRepository.createProblem(submitter.id, {
        title: `PHASE13 Rural water monitoring ${suffix}`,
        description:
          "Villages need affordable monitoring of drinking-water points and faster maintenance response.",
        category: "Water and Sanitation",
        societalContext:
          "The challenge affects multiple rural communities and requires a collaborative technical solution.",
        location: "Ranchi district",
        district: "Ranchi",
        block: "Kanke",
        villageLocality: "Phase 13 village cluster",
        priority: "HIGH",
        desiredOutcome: "Reliable water points and faster fault response.",
        supportingInformation:
          "PHASE13_MATCH_MARKER community survey and sensor pilot context.",
        evidence: [
          {
            type: "DOCUMENT",
            title: "Community survey",
            fileName: "phase13-survey.pdf",
            storageKey: `phase13/${suffix}/survey.pdf`,
            mimeType: "application/pdf",
          },
          {
            type: "IMAGE",
            title: "Water point photo",
            externalUrl: "https://example.test/phase13-water-point.jpg",
          },
          {
            type: "VIDEO",
            title: "Maintenance demonstration",
            externalUrl: "https://example.test/phase13-demo.mp4",
          },
        ],
      });
      problemId = problem.id;
      expect(problem.currentStatus).toBe(ProblemStatus.SUBMITTED);
      expect(problem.evidence).toHaveLength(3);

      const aiService = new ProblemAiService(new ProblemAiRepository(client), {
        modelName: "phase13-mock-analysis",
        promptVersion: "phase13-test",
        analyze: async () => ({
          isSocietalProblem: true,
          reason:
            "The problem affects multiple villages and can be addressed through collaborative innovation.",
          category: "Water and Sanitation",
          summary:
            "Rural water points need low-cost monitoring and maintenance response.",
          keywords: ["water", "rural", "sensors"],
          requiredExpertise: ["IoT", "water systems"],
          requiredFacilities: ["field testing laboratory"],
          priority: "HIGH",
          potentialSolutionAreas: [
            "sensor monitoring",
            "community maintenance",
          ],
          confidence: 0.94,
        }),
      });
      const analysis = await aiService.triggerAnalysis(problem.id);
      expect(analysis.processingStatus).toBe("COMPLETED");
      expect(analysis.isSocietalProblem).toBe(true);
      await problemRepository.transitionProblem(
        problem.id,
        ministry.id,
        "AI_SERVICE",
        ProblemStatus.AI_VALIDATED,
        "Deterministic Phase 13 AI validation",
      );
      await problemRepository.transitionProblem(
        problem.id,
        ministry.id,
        "MINISTRY_ADMIN",
        ProblemStatus.MINISTRY_REVIEW,
        "Ministry reviewed AI analysis",
      );
      await problemRepository.transitionProblem(
        problem.id,
        ministry.id,
        "MINISTRY_ADMIN",
        ProblemStatus.MINISTRY_APPROVED,
        "Ministry approved the societal problem",
      );

      const matchingService = new UniversityMatchingService(
        new UniversityMatchingRepository(client),
        new Phase13EmbeddingProvider(),
        new DevelopmentUniversityRankingProvider(),
      );
      const matching = await matchingService.triggerMatching(problem.id);
      expect(matching.latestRun?.processingStatus).toBe("COMPLETED");
      const fixtureRecommendations = matching.recommendations.filter(
        (recommendation) =>
          universityIds.includes(recommendation.university.id),
      );
      expect(fixtureRecommendations.length).toBeGreaterThanOrEqual(3);
      expect(fixtureRecommendations[0]?.evidence.length).toBeGreaterThan(0);
      expect(fixtureRecommendations[0]?.justification).toContain(
        "retrieved university evidence",
      );

      const removedRecommendation = fixtureRecommendations[2]!;
      await matchingService.removeRecommendation(
        problem.id,
        removedRecommendation.id,
        ministry.id,
      );
      const approvedRecommendations = fixtureRecommendations.slice(0, 2);
      const approved = await matchingService.approveRecommendations(
        problem.id,
        ministry.id,
        approvedRecommendations.map((recommendation) => recommendation.id),
      );
      expect(
        approved.recommendations.filter(
          (recommendation) => recommendation.decision === "APPROVED",
        ),
      ).toHaveLength(2);

      const universityCollaborationService = new UniversityCollaborationService(
        new UniversityAssignmentRepository(client),
        new UniversityTeamRepository(client),
        new ProposalRepository(client),
      );
      const invitations = await universityCollaborationService.sendInvitations(
        problem.id,
        ministry.id,
        {
          matchIds: approvedRecommendations.map(
            (recommendation) => recommendation.id,
          ),
        },
      );
      expect(invitations).toHaveLength(2);
      const typedInvitations = invitations as Array<{
        id: string;
        university: { id: string };
      }>;
      const universityUsers = universityFixtures.filter(({ university }) =>
        approvedRecommendations.some(
          (recommendation) => recommendation.university.id === university.id,
        ),
      );
      expect(universityUsers).toHaveLength(2);

      const acceptanceResults = await Promise.allSettled(
        universityUsers.map(({ user }) =>
          universityCollaborationService.acceptAssignment(
            user.id,
            typedInvitations.find(
              (invitation) =>
                invitation.university.id === (user.universityId ?? ""),
            )!.id,
          ),
        ),
      );
      expect(
        acceptanceResults.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        acceptanceResults.filter((result) => result.status === "rejected"),
      ).toHaveLength(1);
      const winnerIndex = acceptanceResults.findIndex(
        (result) => result.status === "fulfilled",
      );
      const winner = universityUsers[winnerIndex]!;
      const loser = universityUsers[1 - winnerIndex]!;
      const assignmentRows = await client.universityProblemAssignment.findMany({
        where: { problemId: problem.id },
      });
      expect(
        assignmentRows.filter((assignment) => assignment.status === "ACCEPTED"),
      ).toHaveLength(1);
      expect(
        assignmentRows.find(
          (assignment) => assignment.universityId === loser.university.id,
        )?.status,
      ).toBe("CANCELLED");
      expect(
        await client.universityProjectContext.count({
          where: { problemId: problem.id },
        }),
      ).toBe(1);

      const assignment = assignmentRows.find(
        (item) => item.universityId === winner.university.id,
      )!;
      const team = await universityCollaborationService.saveTeam(
        winner.user.id,
        assignment.id,
        {
          name: "Phase 13 multidisciplinary water team",
          description: "Faculty and student team for field delivery.",
          facultyMentor: {
            name: "Phase 13 Faculty Mentor",
            roleTitle: "Faculty mentor",
          },
          members: [
            {
              name: "Phase 13 Research Student",
              memberType: "RESEARCH_STUDENT",
              roleTitle: "Field researcher",
            },
          ],
        },
      );
      expect(team).toMatchObject({
        name: "Phase 13 multidisciplinary water team",
      });
      const draft = await universityCollaborationService.saveProposalDraft(
        winner.user.id,
        assignment.id,
        {
          title: "Low-cost water point monitoring",
          problemUnderstanding: "Water points need early fault detection.",
          solutionSummary:
            "Deploy low-cost sensors and a community response workflow.",
          technicalApproach: "IoT telemetry with a field dashboard.",
          innovation: "Offline-first alerts for village operators.",
          expectedOutcomes: "Faster maintenance and fewer outages.",
          requiredResources: "Sensors, gateways, and field support.",
          estimatedBudget: 250000,
          timeline: "9 months",
          prototypePlan: "Bench prototype and controlled field test.",
          pilotPlan: "Pilot in three villages.",
          implementationPlan: "Scale through district water teams.",
          expectedSocialImpact: "More reliable drinking water access.",
          requestedSupport: "Funding and pilot support.",
          requestedSupportTypes: ["FUNDING", "PILOT_SUPPORT"],
        },
      );
      expect((draft as { status: string }).status).toBe("DRAFT");
      const proposal = (await universityCollaborationService.submitProposal(
        winner.user.id,
        assignment.id,
      )) as { id: string; status: string };
      expect(proposal.status).toBe("SUBMITTED");

      const industryService = new IndustryCollaborationService();
      const available = await industryService.listAvailableProposals(
        industryUser.id,
        { domain: "water" },
      );
      expect(
        available.some((item) => (item as { id: string }).id === proposal.id),
      ).toBe(true);
      const interest = await industryService.expressInterest(
        industryUser.id,
        proposal.id,
        {
          supportType: "FUNDING",
          message: "We can fund and support the field pilot.",
        },
      );
      const collaboration = await industryService.acceptInterest(
        industryUser.id,
        (interest as { id: string }).id,
        {
          supportType: "FUNDING",
          supportSummary: "Funding and pilot support.",
          funding: {
            fundingType: "FINANCIAL",
            amount: 250000,
            currencyCode: "INR",
            conditionsNotes: "Release against pilot milestones.",
            status: "COMMITTED",
          },
        },
      );
      projectId = (collaboration as { projectId: string }).projectId;
      expect(projectId).toBeTruthy();

      const projectService = new ProjectService(new ProjectRepository(client));
      const milestone = await projectService.createMilestone(
        projectId,
        winner.user.id,
        {
          title: "Field-ready prototype",
          description: "Complete the sensor prototype for field testing.",
          dueDate: "2035-01-01T00:00:00.000Z",
          completionPercentage: 25,
          deliverables: ["Working prototype"],
        },
      );
      const update = await projectService.createUpdate(
        projectId,
        winner.user.id,
        {
          title: "Prototype progress",
          description: "Sensors assembled and bench tested.",
          progressPercentage: 50,
          milestoneId: milestone.id,
          documents: [
            {
              type: "PROTOTYPE_ARTIFACT",
              title: "Bench evidence",
              externalUrl: "https://example.test/phase13-bench",
            },
          ],
        },
      );
      expect(update).toMatchObject({ title: "Prototype progress" });

      for (const status of [
        ProjectStatus.PROTOTYPE_DEVELOPMENT,
        ProjectStatus.FIELD_PILOT,
        ProjectStatus.IMPLEMENTATION,
      ]) {
        await projectService.transitionProject(projectId, winner.user.id, {
          status,
          reason: `Phase 13 moved to ${status}`,
        });
      }
      const impact = await projectService.upsertImpact(
        projectId,
        winner.user.id,
        {
          metricName: "People with reliable water access",
          currentValue: 1200,
          peopleBenefited: 1200,
          locationsCovered: 3,
          unit: "people",
          evidence: "Phase 13 pilot monitoring report",
        },
      );
      expect(impact).toMatchObject({
        peopleBenefited: 1200,
        locationsCovered: 3,
      });
      await projectService.transitionProject(projectId, winner.user.id, {
        status: ProjectStatus.IMPACT_MEASURED,
      });
      await projectService.transitionProject(projectId, winner.user.id, {
        status: ProjectStatus.COMPLETED,
        reason: "Impact measured and implementation completed",
      });

      const [industryProjects, ministryProjects, submitterProjects] =
        await Promise.all([
          projectService.listProjects(industryUser.id, UserRole.INDUSTRY),
          projectService.listProjects(ministry.id, UserRole.MINISTRY_ADMIN),
          projectService.listProjects(submitter.id, UserRole.SUBMITTER),
        ]);
      expect(
        industryProjects.some(
          (item) => (item as { id: string }).id === projectId,
        ),
      ).toBe(true);
      expect(
        ministryProjects.some(
          (item) => (item as { id: string }).id === projectId,
        ),
      ).toBe(true);
      const submitterProject = submitterProjects.find(
        (item) => (item as { id: string }).id === projectId,
      ) as { status: ProjectStatus } | undefined;
      expect(submitterProject?.status).toBe(ProjectStatus.COMPLETED);

      const analyticsAfter = await analyticsRepository.getOverview();
      const [problemCount, completedProjectCount] = await Promise.all([
        client.problem.count(),
        client.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      ]);
      expect(problemCount).toBeGreaterThan(0);
      expect(completedProjectCount).toBeGreaterThan(0);
      expect(analyticsAfter.totalProblems).toBe(problemCount);
      expect(analyticsAfter.completedProjects).toBe(completedProjectCount);
      const finalProject = await client.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      });
      expect(finalProject?.status).toBe(ProjectStatus.COMPLETED);

      const app = createApp({ environment: testEnvironment });
      const tokenService = new TokenService(testEnvironment);
      const token = (id: string, role: UserRole) =>
        tokenService.createAccessToken(id, role);
      const auth = (id: string, role: UserRole) => ({
        authorization: `Bearer ${token(id, role)}`,
      });
      expect((await request(app).get("/api/problems/mine")).status).toBe(401);
      expect(
        (
          await request(app)
            .get(`/api/problems/${problem.id}`)
            .set(auth(otherSubmitter.id, UserRole.SUBMITTER))
        ).status,
      ).toBe(404);
      expect(
        (
          await request(app)
            .get("/api/problems/not-a-uuid")
            .set(auth(submitter.id, UserRole.SUBMITTER))
        ).status,
      ).toBe(400);
      expect(
        (
          await request(app)
            .post("/api/problems")
            .set(auth(industryUser.id, UserRole.INDUSTRY))
            .send({})
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .get("/api/analytics/ministry")
            .set(auth(submitter.id, UserRole.SUBMITTER))
        ).status,
      ).toBe(403);
      const analyticsResponse = await request(app)
        .get("/api/analytics/ministry")
        .set(auth(ministry.id, UserRole.MINISTRY_ADMIN));
      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.data.overview.completedProjects).toBe(
        analyticsAfter.completedProjects,
      );
    } finally {
      if (projectId)
        await client.project.deleteMany({ where: { id: projectId } });
      if (problemId) await client.problem.delete({ where: { id: problemId } });
      if (userIds.length)
        await client.user.deleteMany({ where: { id: { in: userIds } } });
      if (industryIds.length)
        await client.industry.deleteMany({
          where: { id: { in: industryIds } },
        });
      if (universityIds.length)
        await client.university.deleteMany({
          where: { id: { in: universityIds } },
        });
      await client.$disconnect();
    }
  }, 120_000);
});

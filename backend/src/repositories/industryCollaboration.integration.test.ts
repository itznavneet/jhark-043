import { randomUUID } from "node:crypto";
import {
  PrismaClient,
  ProblemStatus,
  ProposalStatus,
  ProjectStatus,
  UserRole,
} from "@prisma/client";
import { describe, expect, it } from "vitest";
import { IndustryCollaborationRepository } from "./industryCollaboration.repository.js";
import { ProjectRepository } from "./project.repository.js";

const runIntegrationTests = process.env.RUN_INDUSTRY_INTEGRATION === "true";

describe.skipIf(!runIntegrationTests)(
  "industry collaboration PostgreSQL integration",
  () => {
    it("isolates industries, prevents duplicate interest, records funding, and creates a project", async () => {
      const client = new PrismaClient();
      const suffix = randomUUID().slice(0, 8);
      let problemId: string | undefined;
      let proposalId: string | undefined;
      const industryIds: string[] = [];
      const userIds: string[] = [];

      try {
        const submitter = await client.user.create({
          data: {
            email: `phase9-submit-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.SUBMITTER,
            displayName: "Phase 9 Integration Submitter",
            submitterProfile: {
              create: {
                type: "CITIZEN",
                displayName: "Phase 9 Integration Submitter",
              },
            },
          },
          include: { submitterProfile: true },
        });
        userIds.push(submitter.id);

        const university = await client.university.create({
          data: {
            name: `Phase 9 Integration University ${suffix}`,
            shortName: `P9-${suffix}`,
            isApproved: true,
          },
        });
        const universityUser = await client.user.create({
          data: {
            email: `phase9-university-${suffix}@example.test`,
            passwordHash: "integration-test-hash",
            role: UserRole.UNIVERSITY,
            displayName: "Phase 9 Integration University User",
            universityId: university.id,
          },
        });
        userIds.push(universityUser.id);
        const problem = await client.problem.create({
          data: {
            submitterId: submitter.submitterProfile!.id,
            title: `Community water technology ${suffix}`,
            description:
              "A village water monitoring challenge requiring sensors and field deployment.",
            currentStatus: ProblemStatus.PROPOSAL_SUBMITTED,
            statusHistory: {
              create: [
                { newStatus: ProblemStatus.SUBMITTED, reason: "Fixture" },
                {
                  oldStatus: ProblemStatus.SUBMITTED,
                  newStatus: ProblemStatus.PROPOSAL_SUBMITTED,
                  reason: "Fixture university proposal",
                },
              ],
            },
          },
        });
        problemId = problem.id;
        const team = await client.projectTeam.create({
          data: {
            problemId: problem.id,
            universityId: university.id,
            name: "Water technology team",
            members: {
              create: [
                { name: "Faculty Mentor", memberType: "FACULTY_MENTOR" },
                { name: "Research Student", memberType: "RESEARCH_STUDENT" },
              ],
            },
          },
        });
        const proposal = await client.proposal.create({
          data: {
            problemId: problem.id,
            universityId: university.id,
            teamId: team.id,
            title: "Low-cost water monitoring prototype",
            problemUnderstanding:
              "Village water points need reliable monitoring and maintenance response.",
            solutionSummary:
              "Deploy low-cost sensors and a community response dashboard.",
            technicalApproach: "IoT sensors and field data collection.",
            expectedSocialImpact: "Fewer water point outages for residents.",
            estimatedBudget: 250000,
            requestedSupportTypes: ["FUNDING", "TECHNICAL_SUPPORT"],
            status: ProposalStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        });
        proposalId = proposal.id;

        const industries = await Promise.all(
          ["A", "B"].map(async (label) => {
            const industry = await client.industry.create({
              data: {
                name: `Phase 9 Integration Industry ${suffix}-${label}`,
                isApproved: true,
                users: {
                  create: {
                    email: `phase9-industry-${suffix}-${label}@example.test`,
                    passwordHash: "integration-test-hash",
                    role: UserRole.INDUSTRY,
                    displayName: `Phase 9 Industry ${label}`,
                  },
                },
              },
              include: { users: true },
            });
            return { industry, user: industry.users[0]! };
          }),
        );
        industryIds.push(...industries.map(({ industry }) => industry.id));
        userIds.push(...industries.map(({ user }) => user.id));

        const repository = new IndustryCollaborationRepository(client);
        const available = await repository.listEligibleProposals({
          domain: "water",
          technology: "sensors",
          minBudget: 200000,
          maxBudget: 300000,
          supportType: "FUNDING",
        });
        expect(available.map((item) => item.id)).toContain(proposal.id);

        const firstInterest = await repository.expressInterest(
          industries[0]!.user.id,
          proposal.id,
          { supportType: "FUNDING", message: "We can fund a pilot." },
        );
        const secondInterest = await repository.expressInterest(
          industries[1]!.user.id,
          proposal.id,
          { supportType: "TECHNICAL_SUPPORT" },
        );
        await expect(
          repository.expressInterest(industries[0]!.user.id, proposal.id, {
            supportType: "FUNDING",
          }),
        ).rejects.toMatchObject({ code: "PROPOSAL_INTEREST_ALREADY_EXISTS" });

        const collaboration = await repository.acceptInterest(
          industries[0]!.user.id,
          firstInterest.id,
          {
            supportType: "FUNDING",
            supportSummary: "Funding and pilot mentoring.",
            funding: {
              fundingType: "FINANCIAL",
              amount: 250000,
              currencyCode: "INR",
              conditionsNotes: "Release after pilot plan review.",
              status: "COMMITTED",
            },
          },
        );
        expect(collaboration.status).toBe("CONFIRMED");
        expect(collaboration.projectId).toBeTruthy();
        expect(collaboration.fundingRecords[0]?.amount?.toNumber()).toBe(
          250000,
        );

        const projectRepository = new ProjectRepository(client);
        expect(
          await projectRepository.listForUser(
            universityUser.id,
            UserRole.UNIVERSITY,
          ),
        ).toHaveLength(1);
        expect(
          await projectRepository.listForUser(
            industries[0]!.user.id,
            UserRole.INDUSTRY,
          ),
        ).toHaveLength(1);
        expect(
          await projectRepository.listForUser(submitter.id, UserRole.SUBMITTER),
        ).toHaveLength(1);
        expect(
          await projectRepository.listForUser(
            industries[1]!.user.id,
            UserRole.INDUSTRY,
          ),
        ).toHaveLength(0);

        const projectId = collaboration.projectId!;
        const transitioned = await projectRepository.transitionForUniversity(
          projectId,
          universityUser.id,
          {
            status: ProjectStatus.PROTOTYPE_DEVELOPMENT,
            reason: "Started prototype",
          },
        );
        expect(transitioned.status).toBe(ProjectStatus.PROTOTYPE_DEVELOPMENT);
        const milestone = await projectRepository.createMilestone(
          projectId,
          universityUser.id,
          {
            title: "Prototype build",
            dueDate: "2030-01-01T00:00:00.000Z",
            completionPercentage: 25,
            deliverables: ["Working prototype"],
          },
        );
        expect(milestone.completionPercentage).toBe(25);
        const updatedMilestone = await projectRepository.updateMilestone(
          projectId,
          milestone.id,
          universityUser.id,
          {
            title: "Prototype build",
            status: "IN_PROGRESS",
            completionPercentage: 50,
          },
        );
        expect(updatedMilestone.completionPercentage).toBe(50);
        const progressUpdate = await projectRepository.createUpdate(
          projectId,
          universityUser.id,
          {
            title: "Prototype update",
            description: "Sensors assembled for bench testing.",
            progressPercentage: 50,
            milestoneId: milestone.id,
            documents: [
              {
                type: "PROTOTYPE_ARTIFACT",
                title: "Bench evidence",
                externalUrl: "https://example.test/bench-evidence",
              },
            ],
          },
        );
        expect(progressUpdate.documents).toHaveLength(1);
        const impact = await projectRepository.upsertImpact(
          projectId,
          universityUser.id,
          {
            metricName: "People reached",
            currentValue: 120,
            peopleBenefited: 120,
            locationsCovered: 3,
            unit: "people",
          },
        );
        expect(impact.peopleBenefited).toBe(120);
        expect(
          await client.projectStatusHistory.count({ where: { projectId } }),
        ).toBe(2);
        await expect(
          projectRepository.transitionForUniversity(
            projectId,
            industries[0]!.user.id,
            { status: ProjectStatus.FIELD_PILOT },
          ),
        ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" });

        await expect(
          repository.acceptInterest(industries[1]!.user.id, secondInterest.id, {
            supportType: "TECHNICAL_SUPPORT",
          }),
        ).rejects.toMatchObject({ code: "PROPOSAL_INTEREST_NOT_ACCEPTABLE" });

        expect(
          await repository.listCollaborationsForIndustry(
            industries[0]!.user.id,
          ),
        ).toHaveLength(1);
        expect(
          await repository.listCollaborationsForIndustry(
            industries[1]!.user.id,
          ),
        ).toHaveLength(0);
        expect(
          await repository.listProjectsForIndustry(industries[0]!.user.id),
        ).toHaveLength(1);
        expect(
          await repository.listProjectsForIndustry(industries[1]!.user.id),
        ).toHaveLength(0);
        expect(
          await client.problemStatusHistory.findMany({
            where: { problemId: problem.id },
            orderBy: { createdAt: "asc" },
            select: { newStatus: true },
          }),
        ).toEqual([
          { newStatus: ProblemStatus.SUBMITTED },
          { newStatus: ProblemStatus.PROPOSAL_SUBMITTED },
          { newStatus: ProblemStatus.INDUSTRY_REVIEW },
          { newStatus: ProblemStatus.INDUSTRY_ACCEPTED },
          { newStatus: ProblemStatus.COLLABORATION_CONFIRMED },
          { newStatus: ProblemStatus.PROTOTYPE_DEVELOPMENT },
        ]);
      } finally {
        if (proposalId) {
          await client.project.deleteMany({ where: { proposalId } });
        }
        if (problemId) {
          await client.problem.delete({ where: { id: problemId } });
        }
        if (userIds.length) {
          await client.user.deleteMany({ where: { id: { in: userIds } } });
        }
        if (industryIds.length) {
          await client.industry.deleteMany({
            where: { id: { in: industryIds } },
          });
        }
        await client.$disconnect();
      }
    });
  },
);

import { describe, expect, it, vi } from "vitest";
import { UniversityCollaborationService } from "./universityCollaboration.service.js";

describe("UniversityCollaborationService", () => {
  it("requires an approved university organization for university workspace access", async () => {
    const assignments = {
      findUniversityForUser: vi.fn().mockResolvedValue({ university: null }),
    };
    const service = new UniversityCollaborationService(
      assignments as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.listUniversityAssignments("unlinked-user"),
    ).rejects.toMatchObject({
      code: "UNIVERSITY_ORGANIZATION_REQUIRED",
      statusCode: 403,
    });
  });

  it("delegates accepted-university responses only after organization authorization", async () => {
    const assignments = {
      findUniversityForUser: vi.fn().mockResolvedValue({
        university: { id: "university-1", isApproved: true },
      }),
      acceptForUniversity: vi.fn().mockResolvedValue({
        id: "assignment-1",
        status: "ACCEPTED",
        invitedAt: null,
        respondedAt: new Date("2026-01-01T00:00:00.000Z"),
        responseNote: "accepted",
        projectContext: { id: "context-1" },
        problem: {
          id: "problem-1",
          title: "Water access",
          description: "A community challenge.",
          currentStatus: "UNIVERSITY_ACCEPTED",
          geography: null,
          district: null,
          block: null,
          desiredOutcome: null,
          category: null,
        },
        university: {
          id: "university-1",
          name: "Example University",
          shortName: null,
        },
      }),
    };
    const service = new UniversityCollaborationService(
      assignments as never,
      {} as never,
      {} as never,
    );

    const result = await service.acceptAssignment(
      "university-user",
      "assignment-1",
    );

    expect(assignments.acceptForUniversity).toHaveBeenCalledWith(
      "university-user",
      "assignment-1",
    );
    expect(result).toMatchObject({
      id: "assignment-1",
      status: "ACCEPTED",
      projectContextId: "context-1",
    });
  });

  it("delegates draft and submission operations for an authorized university", async () => {
    const assignments = {
      findUniversityForUser: vi.fn().mockResolvedValue({
        university: { id: "university-1", isApproved: true },
      }),
    };
    const proposals = {
      saveDraft: vi.fn().mockResolvedValue({
        id: "proposal-1",
        problemId: "problem-1",
        universityId: "university-1",
        teamId: "team-1",
        title: "Water prototype",
        problemUnderstanding: "A community challenge requiring research.",
        solutionSummary: "A low-cost monitoring and response solution.",
        technicalApproach: null,
        innovation: null,
        expectedOutcomes: null,
        requiredResources: null,
        estimatedBudget: null,
        timeline: null,
        prototypePlan: null,
        pilotPlan: null,
        implementationPlan: null,
        expectedSocialImpact: null,
        requestedSupport: null,
        status: "DRAFT",
        submittedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        team: null,
      }),
      submitForUniversity: vi.fn().mockResolvedValue({
        id: "proposal-1",
        problemId: "problem-1",
        universityId: "university-1",
        teamId: "team-1",
        title: "Water prototype",
        problemUnderstanding: "A community challenge requiring research.",
        solutionSummary: "A low-cost monitoring and response solution.",
        technicalApproach: null,
        innovation: null,
        expectedOutcomes: null,
        requiredResources: null,
        estimatedBudget: null,
        timeline: null,
        prototypePlan: null,
        pilotPlan: null,
        implementationPlan: null,
        expectedSocialImpact: null,
        requestedSupport: null,
        status: "SUBMITTED",
        submittedAt: new Date("2026-01-01T00:00:00.000Z"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        team: null,
      }),
    };
    const service = new UniversityCollaborationService(
      assignments as never,
      {} as never,
      proposals as never,
    );
    const input = {
      title: "Water prototype",
      problemUnderstanding: "A community challenge requiring research.",
      solutionSummary: "A low-cost monitoring and response solution.",
    };

    await service.saveProposalDraft("university-user", "assignment-1", input);
    const submitted = await service.submitProposal(
      "university-user",
      "assignment-1",
    );

    expect(proposals.saveDraft).toHaveBeenCalledWith(
      "university-user",
      "assignment-1",
      input,
    );
    expect(proposals.submitForUniversity).toHaveBeenCalledWith(
      "university-user",
      "assignment-1",
    );
    expect(submitted).toMatchObject({ id: "proposal-1", status: "SUBMITTED" });
  });
});

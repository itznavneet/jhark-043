import {
  ProposalRepository,
  type ProposalRecord,
} from "../repositories/proposal.repository.js";
import {
  UniversityAssignmentRepository,
  type AssignmentRecord,
} from "../repositories/university-assignment.repository.js";
import {
  UniversityTeamRepository,
  type TeamRecord,
} from "../repositories/university-team.repository.js";
import type {
  ProposalDraftInput,
  RejectAssignmentInput,
  SendInvitationsInput,
  TeamInput,
} from "../types/collaboration.js";
import { AppError } from "../utils/appError.js";

export interface UniversityCollaborationServiceContract {
  sendInvitations(
    problemId: string,
    ministryUserId: string,
    input: SendInvitationsInput,
  ): Promise<unknown[]>;
  listMinistryInvitations(problemId: string): Promise<unknown[]>;
  listUniversityAssignments(userId: string): Promise<unknown[]>;
  getUniversityAssignment(
    userId: string,
    assignmentId: string,
  ): Promise<unknown>;
  acceptAssignment(userId: string, assignmentId: string): Promise<unknown>;
  rejectAssignment(
    userId: string,
    assignmentId: string,
    input: RejectAssignmentInput,
  ): Promise<unknown>;
  getTeam(userId: string, assignmentId: string): Promise<unknown>;
  saveTeam(
    userId: string,
    assignmentId: string,
    input: TeamInput,
  ): Promise<unknown>;
  getProposal(userId: string, assignmentId: string): Promise<unknown>;
  saveProposalDraft(
    userId: string,
    assignmentId: string,
    input: ProposalDraftInput,
  ): Promise<unknown>;
  submitProposal(userId: string, assignmentId: string): Promise<unknown>;
  listSubmittedProposalsForIndustry(): Promise<unknown[]>;
}

export class UniversityCollaborationService implements UniversityCollaborationServiceContract {
  constructor(
    private readonly assignments = new UniversityAssignmentRepository(),
    private readonly teams = new UniversityTeamRepository(),
    private readonly proposals = new ProposalRepository(),
  ) {}

  async sendInvitations(
    problemId: string,
    ministryUserId: string,
    input: SendInvitationsInput,
  ): Promise<unknown[]> {
    const records = await this.assignments.sendInvitations(
      problemId,
      input.matchIds,
      ministryUserId,
    );
    return records.map(toAssignmentView);
  }

  async listMinistryInvitations(problemId: string): Promise<unknown[]> {
    return (await this.assignments.listForMinistry(problemId)).map(
      toAssignmentView,
    );
  }

  async listUniversityAssignments(userId: string): Promise<unknown[]> {
    await this.requireApprovedUniversity(userId);
    return (await this.assignments.listForUniversity(userId)).map(
      toAssignmentView,
    );
  }

  async getUniversityAssignment(
    userId: string,
    assignmentId: string,
  ): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    const assignment = await this.assignments.findForUniversity(
      userId,
      assignmentId,
    );
    if (!assignment) throw assignmentNotFoundError();
    return toAssignmentView(assignment);
  }

  async acceptAssignment(
    userId: string,
    assignmentId: string,
  ): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    return toAssignmentView(
      await this.assignments.acceptForUniversity(userId, assignmentId),
    );
  }

  async rejectAssignment(
    userId: string,
    assignmentId: string,
    input: RejectAssignmentInput,
  ): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    return toAssignmentView(
      await this.assignments.rejectForUniversity(
        userId,
        assignmentId,
        input.reason,
      ),
    );
  }

  async getTeam(userId: string, assignmentId: string): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    const team = await this.teams.findForUniversity(userId, assignmentId);
    return team ? toTeamView(team) : null;
  }

  async saveTeam(
    userId: string,
    assignmentId: string,
    input: TeamInput,
  ): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    return toTeamView(
      await this.teams.saveForUniversity(userId, assignmentId, input),
    );
  }

  async getProposal(userId: string, assignmentId: string): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    const proposal = await this.proposals.findForUniversity(
      userId,
      assignmentId,
    );
    return proposal ? toProposalView(proposal) : null;
  }

  async saveProposalDraft(
    userId: string,
    assignmentId: string,
    input: ProposalDraftInput,
  ): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    return toProposalView(
      await this.proposals.saveDraft(userId, assignmentId, input),
    );
  }

  async submitProposal(userId: string, assignmentId: string): Promise<unknown> {
    await this.requireApprovedUniversity(userId);
    return toProposalView(
      await this.proposals.submitForUniversity(userId, assignmentId),
    );
  }

  listSubmittedProposalsForIndustry(): Promise<unknown[]> {
    return this.proposals
      .listSubmittedForIndustry()
      .then((proposals) => proposals.map(toIndustryProposalView));
  }

  private async requireApprovedUniversity(userId: string): Promise<string> {
    const user = await this.assignments.findUniversityForUser(userId);
    if (!user?.university?.isApproved) {
      throw new AppError(
        "An approved university organization is required",
        403,
        "UNIVERSITY_ORGANIZATION_REQUIRED",
      );
    }
    return user.university.id;
  }
}

function toAssignmentView(assignment: AssignmentRecord) {
  return {
    id: assignment.id,
    status: assignment.status,
    invitedAt: assignment.invitedAt?.toISOString() ?? null,
    respondedAt: assignment.respondedAt?.toISOString() ?? null,
    responseNote: assignment.responseNote,
    problem: {
      id: assignment.problem.id,
      title: assignment.problem.title,
      description: assignment.problem.description,
      currentStatus: assignment.problem.currentStatus,
      category: assignment.problem.category,
      location: assignment.problem.geography,
      district: assignment.problem.district,
      block: assignment.problem.block,
      desiredOutcome: assignment.problem.desiredOutcome,
    },
    university: assignment.university,
    projectContextId: assignment.projectContext?.id ?? null,
  };
}

function toTeamView(team: TeamRecord) {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    formedAt: team.formedAt.toISOString(),
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      memberType: member.memberType,
      roleTitle: member.roleTitle,
      department: member.department,
      email: member.email,
    })),
  };
}

function toProposalView(proposal: ProposalRecord) {
  return {
    id: proposal.id,
    problemId: proposal.problemId,
    universityId: proposal.universityId,
    teamId: proposal.teamId,
    title: proposal.title,
    problemUnderstanding: proposal.problemUnderstanding,
    solutionSummary: proposal.solutionSummary,
    technicalApproach: proposal.technicalApproach,
    innovation: proposal.innovation,
    expectedOutcomes: proposal.expectedOutcomes,
    requiredResources: proposal.requiredResources,
    estimatedBudget: proposal.estimatedBudget?.toNumber() ?? null,
    timeline: proposal.timeline,
    prototypePlan: proposal.prototypePlan,
    pilotPlan: proposal.pilotPlan,
    implementationPlan: proposal.implementationPlan,
    expectedSocialImpact: proposal.expectedSocialImpact,
    requestedSupport: proposal.requestedSupport,
    requestedSupportTypes: proposal.requestedSupportTypes,
    status: proposal.status,
    submittedAt: proposal.submittedAt?.toISOString() ?? null,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  };
}

function toIndustryProposalView(
  proposal: Awaited<
    ReturnType<ProposalRepository["listSubmittedForIndustry"]>
  >[number],
) {
  return {
    id: proposal.id,
    title: proposal.title,
    problemUnderstanding: proposal.problemUnderstanding,
    solutionSummary: proposal.solutionSummary,
    technicalApproach: proposal.technicalApproach,
    innovation: proposal.innovation,
    expectedOutcomes: proposal.expectedOutcomes,
    requiredResources: proposal.requiredResources,
    estimatedBudget: proposal.estimatedBudget?.toNumber() ?? null,
    timeline: proposal.timeline,
    prototypePlan: proposal.prototypePlan,
    pilotPlan: proposal.pilotPlan,
    implementationPlan: proposal.implementationPlan,
    expectedSocialImpact: proposal.expectedSocialImpact,
    requestedSupport: proposal.requestedSupport,
    requestedSupportTypes: proposal.requestedSupportTypes,
    status: proposal.status,
    submittedAt: proposal.submittedAt?.toISOString() ?? null,
    problem: proposal.problem,
    university: proposal.university,
    team: proposal.team,
  };
}

function assignmentNotFoundError(): AppError {
  return new AppError(
    "University assignment not found",
    404,
    "ASSIGNMENT_NOT_FOUND",
  );
}

import {
  IndustryCollaborationRepository,
  type IndustryCollaborationRecord,
  type IndustryInterestRecord,
  type IndustryProjectRecord,
  type IndustryProposalRecord,
} from "../repositories/industryCollaboration.repository.js";
import type {
  AcceptIndustryInterestInput,
  ExpressIndustryInterestInput,
  IndustryProposalQueryInput,
} from "../types/industryCollaboration.js";
import { AppError } from "../utils/appError.js";

export interface IndustryCollaborationServiceContract {
  listAvailableProposals(
    userId: string,
    query: IndustryProposalQueryInput,
  ): Promise<unknown[]>;
  getAvailableProposal(userId: string, proposalId: string): Promise<unknown>;
  expressInterest(
    userId: string,
    proposalId: string,
    input: ExpressIndustryInterestInput,
  ): Promise<unknown>;
  listInterests(userId: string): Promise<unknown[]>;
  acceptInterest(
    userId: string,
    interestId: string,
    input: AcceptIndustryInterestInput,
  ): Promise<unknown>;
  listCollaborations(userId: string): Promise<unknown[]>;
  listProjects(userId: string): Promise<unknown[]>;
}

export class IndustryCollaborationService implements IndustryCollaborationServiceContract {
  constructor(
    private readonly repository = new IndustryCollaborationRepository(),
  ) {}

  async listAvailableProposals(
    userId: string,
    query: IndustryProposalQueryInput,
  ): Promise<unknown[]> {
    await this.requireApprovedIndustry(userId);
    return (await this.repository.listEligibleProposals(query)).map(
      toProposalView,
    );
  }

  async getAvailableProposal(
    userId: string,
    proposalId: string,
  ): Promise<unknown> {
    const industryId = await this.requireApprovedIndustry(userId);
    const proposal = await this.repository.findEligibleProposal(proposalId);
    if (!proposal) {
      throw new AppError(
        "Submitted proposal is not available for industry collaboration",
        404,
        "ELIGIBLE_PROPOSAL_NOT_FOUND",
      );
    }
    await this.repository.recordProposalView(proposalId, industryId);
    return toProposalView(proposal);
  }

  async expressInterest(
    userId: string,
    proposalId: string,
    input: ExpressIndustryInterestInput,
  ): Promise<unknown> {
    await this.requireApprovedIndustry(userId);
    return toInterestView(
      await this.repository.expressInterest(userId, proposalId, input),
    );
  }

  async listInterests(userId: string): Promise<unknown[]> {
    await this.requireApprovedIndustry(userId);
    return (await this.repository.listInterestsForIndustry(userId)).map(
      toInterestView,
    );
  }

  async acceptInterest(
    userId: string,
    interestId: string,
    input: AcceptIndustryInterestInput,
  ): Promise<unknown> {
    await this.requireApprovedIndustry(userId);
    return toCollaborationView(
      await this.repository.acceptInterest(userId, interestId, input),
    );
  }

  async listCollaborations(userId: string): Promise<unknown[]> {
    await this.requireApprovedIndustry(userId);
    return (await this.repository.listCollaborationsForIndustry(userId)).map(
      toCollaborationView,
    );
  }

  async listProjects(userId: string): Promise<unknown[]> {
    await this.requireApprovedIndustry(userId);
    return (await this.repository.listProjectsForIndustry(userId)).map(
      toProjectView,
    );
  }

  private async requireApprovedIndustry(userId: string): Promise<string> {
    const user = await this.repository.findIndustryForUser(userId);
    if (!user?.industry?.isApproved) {
      throw new AppError(
        "An approved industry organization is required",
        403,
        "INDUSTRY_ORGANIZATION_REQUIRED",
      );
    }
    return user.industry.id;
  }
}

function toProposalView(proposal: IndustryProposalRecord) {
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

function toInterestView(interest: IndustryInterestRecord) {
  return {
    id: interest.id,
    proposalId: interest.proposalId,
    industryId: interest.industryId,
    supportType: interest.supportType,
    status: interest.status,
    message: interest.message,
    createdAt: interest.createdAt.toISOString(),
    updatedAt: interest.updatedAt.toISOString(),
    proposal: toProposalView(interest.proposal),
    industry: interest.industry,
  };
}

function toCollaborationView(collaboration: IndustryCollaborationRecord) {
  return {
    id: collaboration.id,
    proposalId: collaboration.proposalId,
    industryId: collaboration.industryId,
    projectId: collaboration.projectId,
    supportType: collaboration.supportType,
    status: collaboration.status,
    supportSummary: collaboration.supportSummary,
    confirmedAt: collaboration.confirmedAt?.toISOString() ?? null,
    createdAt: collaboration.createdAt.toISOString(),
    updatedAt: collaboration.updatedAt.toISOString(),
    proposal: toProposalView(collaboration.proposal),
    industry: collaboration.industry,
    project: collaboration.project
      ? {
          id: collaboration.project.id,
          status: collaboration.project.status,
          startedAt: collaboration.project.startedAt?.toISOString() ?? null,
          completedAt: collaboration.project.completedAt?.toISOString() ?? null,
        }
      : null,
    fundingRecords: collaboration.fundingRecords.map((funding) => ({
      id: funding.id,
      fundingType: funding.fundingType,
      status: funding.status,
      amount: funding.amount?.toNumber() ?? null,
      currencyCode: funding.currencyCode,
      conditionsNotes: funding.conditionsNotes,
      committedAt: funding.committedAt?.toISOString() ?? null,
      receivedAt: funding.receivedAt?.toISOString() ?? null,
    })),
  };
}

function toProjectView(project: IndustryProjectRecord) {
  return {
    id: project.id,
    status: project.status,
    startedAt: project.startedAt?.toISOString() ?? null,
    completedAt: project.completedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    proposal: project.proposal,
    collaborations: project.collaborations.map((collaboration) => ({
      id: collaboration.id,
      industryId: collaboration.industryId,
      supportType: collaboration.supportType,
      status: collaboration.status,
      supportSummary: collaboration.supportSummary,
      fundingRecords: collaboration.fundingRecords.map((funding) => ({
        id: funding.id,
        fundingType: funding.fundingType,
        status: funding.status,
        amount: funding.amount?.toNumber() ?? null,
        currencyCode: funding.currencyCode,
        conditionsNotes: funding.conditionsNotes,
      })),
    })),
  };
}

import {
  FundingStatus,
  IndustryProposalInterestStatus,
  Prisma,
  ProblemStatus,
  ProposalStatus,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import { transitionProblemInTransaction } from "./problem-lifecycle.repository.js";
import {
  notifyCollaborationConfirmed,
  notifyIndustryInterest,
} from "../services/notificationEvents.js";
import type {
  AcceptIndustryInterestInput,
  ExpressIndustryInterestInput,
  IndustryProposalQueryInput,
} from "../types/industryCollaboration.js";
import { AppError } from "../utils/appError.js";

const industryProposalSelect = {
  id: true,
  title: true,
  problemUnderstanding: true,
  solutionSummary: true,
  technicalApproach: true,
  innovation: true,
  expectedOutcomes: true,
  requiredResources: true,
  estimatedBudget: true,
  timeline: true,
  prototypePlan: true,
  pilotPlan: true,
  implementationPlan: true,
  expectedSocialImpact: true,
  requestedSupport: true,
  requestedSupportTypes: true,
  status: true,
  submittedAt: true,
  problem: {
    select: {
      id: true,
      title: true,
      description: true,
      currentStatus: true,
      category: { select: { id: true, name: true } },
    },
  },
  university: {
    select: {
      id: true,
      name: true,
      shortName: true,
      description: true,
      city: true,
      state: true,
    },
  },
  team: {
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        select: {
          id: true,
          name: true,
          memberType: true,
          roleTitle: true,
          department: true,
        },
      },
    },
  },
} as const;

const interestInclude = {
  proposal: { select: industryProposalSelect },
  industry: { select: { id: true, name: true } },
} as const;

const collaborationInclude = {
  proposal: { select: industryProposalSelect },
  industry: { select: { id: true, name: true } },
  project: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
    },
  },
  fundingRecords: true,
} as const;

const projectInclude = {
  proposal: {
    select: {
      id: true,
      title: true,
      status: true,
      problem: { select: { id: true, title: true, currentStatus: true } },
      university: { select: { id: true, name: true, shortName: true } },
      team: { select: { id: true, name: true } },
    },
  },
  collaborations: {
    include: { fundingRecords: true },
  },
} as const;

export type IndustryProposalRecord = Prisma.ProposalGetPayload<{
  select: typeof industryProposalSelect;
}>;
export type IndustryInterestRecord = Prisma.IndustryProposalInterestGetPayload<{
  include: typeof interestInclude;
}>;
export type IndustryCollaborationRecord =
  Prisma.IndustryCollaborationGetPayload<{
    include: typeof collaborationInclude;
  }>;
export type IndustryProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export class IndustryCollaborationRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findIndustryForUser(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId },
      select: {
        industry: { select: { id: true, name: true, isApproved: true } },
      },
    });
  }

  listEligibleProposals(
    query: IndustryProposalQueryInput,
  ): Promise<IndustryProposalRecord[]> {
    return this.client.proposal.findMany({
      where: eligibleProposalWhere(query),
      select: industryProposalSelect,
      orderBy: { submittedAt: "desc" },
    });
  }

  findEligibleProposal(
    proposalId: string,
  ): Promise<IndustryProposalRecord | null> {
    return this.client.proposal.findFirst({
      where: { id: proposalId, ...eligibleProposalWhere({}) },
      select: industryProposalSelect,
    });
  }

  recordProposalView(proposalId: string, industryId: string) {
    return this.client.industryProposalView.upsert({
      where: { proposalId_industryId: { proposalId, industryId } },
      update: { viewedAt: new Date() },
      create: { proposalId, industryId },
    });
  }

  async expressInterest(
    userId: string,
    proposalId: string,
    input: ExpressIndustryInterestInput,
  ): Promise<IndustryInterestRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const industryId = await requireApprovedIndustry(transaction, userId);
        const proposal = await transaction.proposal.findFirst({
          where: { id: proposalId, ...eligibleProposalWhere({}) },
          select: {
            id: true,
            status: true,
            problem: { select: { id: true, currentStatus: true } },
          },
        });
        if (!proposal) throw eligibleProposalNotFoundError();

        const interest = await transaction.industryProposalInterest.create({
          data: {
            proposalId,
            industryId,
            supportType: input.supportType,
            message: input.message ?? null,
          },
        });
        await notifyIndustryInterest(transaction, proposalId, interest.id);

        if (proposal.status === ProposalStatus.SUBMITTED) {
          const claimedReview = await transaction.proposal.updateMany({
            where: { id: proposalId, status: ProposalStatus.SUBMITTED },
            data: { status: ProposalStatus.UNDER_INDUSTRY_REVIEW },
          });
          if (
            claimedReview.count === 1 &&
            proposal.problem.currentStatus === ProblemStatus.PROPOSAL_SUBMITTED
          ) {
            await transitionProblemInTransaction(transaction, {
              problemId: proposal.problem.id,
              from: ProblemStatus.PROPOSAL_SUBMITTED,
              to: ProblemStatus.INDUSTRY_REVIEW,
              actor: "INDUSTRY",
              actorUserId: userId,
              reason: "Industry expressed interest in the submitted proposal",
              metadata: { source: "industry", interestId: interest.id },
            });
          }
        }

        return transaction.industryProposalInterest.findUniqueOrThrow({
          where: { id: interest.id },
          include: interestInclude,
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "This industry has already expressed interest in the proposal",
          409,
          "PROPOSAL_INTEREST_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  listInterestsForIndustry(userId: string): Promise<IndustryInterestRecord[]> {
    return this.client.industryProposalInterest.findMany({
      where: { industry: { users: { some: { id: userId } } } },
      include: interestInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptInterest(
    userId: string,
    interestId: string,
    input: AcceptIndustryInterestInput,
  ): Promise<IndustryCollaborationRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const industryId = await requireApprovedIndustry(transaction, userId);
        const interest = await transaction.industryProposalInterest.findFirst({
          where: { id: interestId, industryId },
          include: {
            proposal: {
              select: {
                id: true,
                status: true,
                problem: {
                  select: { id: true, currentStatus: true },
                },
                project: { select: { id: true } },
              },
            },
          },
        });
        if (!interest) throw interestNotFoundError();

        const existingCollaboration =
          await transaction.industryCollaboration.findUnique({
            where: {
              proposalId_industryId: {
                proposalId: interest.proposalId,
                industryId,
              },
            },
            include: collaborationInclude,
          });
        if (existingCollaboration?.status === "CONFIRMED") {
          return existingCollaboration;
        }
        if (
          interest.status !== IndustryProposalInterestStatus.EXPRESSED &&
          interest.status !== IndustryProposalInterestStatus.UNDER_REVIEW
        ) {
          throw new AppError(
            "This proposal interest cannot be accepted",
            409,
            "PROPOSAL_INTEREST_NOT_ACCEPTABLE",
          );
        }
        if (
          interest.proposal.status !== ProposalStatus.SUBMITTED &&
          interest.proposal.status !== ProposalStatus.UNDER_INDUSTRY_REVIEW
        ) {
          throw proposalUnavailableError();
        }
        if (
          interest.proposal.problem.currentStatus !==
            ProblemStatus.PROPOSAL_SUBMITTED &&
          interest.proposal.problem.currentStatus !==
            ProblemStatus.INDUSTRY_REVIEW
        ) {
          throw proposalUnavailableError();
        }
        if (input.supportType === "FUNDING" && !input.funding) {
          throw new AppError(
            "Funding details are required for funding support",
            400,
            "FUNDING_DETAILS_REQUIRED",
          );
        }

        if (
          interest.proposal.problem.currentStatus ===
          ProblemStatus.PROPOSAL_SUBMITTED
        ) {
          await transitionProblemInTransaction(transaction, {
            problemId: interest.proposal.problem.id,
            from: ProblemStatus.PROPOSAL_SUBMITTED,
            to: ProblemStatus.INDUSTRY_REVIEW,
            actor: "INDUSTRY",
            actorUserId: userId,
            reason: "Industry began review of the submitted proposal",
            metadata: { source: "industry", interestId },
          });
        }
        await transitionProblemInTransaction(transaction, {
          problemId: interest.proposal.problem.id,
          from: ProblemStatus.INDUSTRY_REVIEW,
          to: ProblemStatus.INDUSTRY_ACCEPTED,
          actor: "INDUSTRY",
          actorUserId: userId,
          reason: "Industry accepted the proposal",
          metadata: { source: "industry", interestId },
        });

        const proposalUpdated = await transaction.proposal.updateMany({
          where: {
            id: interest.proposalId,
            status: {
              in: [
                ProposalStatus.SUBMITTED,
                ProposalStatus.UNDER_INDUSTRY_REVIEW,
              ],
            },
          },
          data: { status: ProposalStatus.ACCEPTED },
        });
        if (proposalUpdated.count !== 1) {
          throw proposalUnavailableError();
        }

        const collaboration = await transaction.industryCollaboration.create({
          data: {
            proposalId: interest.proposalId,
            industryId,
            supportType: input.supportType,
            status: "ACCEPTED",
            supportSummary: input.supportSummary ?? null,
          },
        });

        if (input.funding) {
          await transaction.industryFunding.create({
            data: {
              collaborationId: collaboration.id,
              fundingType: input.funding.fundingType,
              amount: input.funding.amount ?? null,
              currencyCode: input.funding.currencyCode ?? null,
              conditionsNotes: input.funding.conditionsNotes ?? null,
              status: input.funding.status,
              committedAt:
                input.funding.status === FundingStatus.COMMITTED
                  ? new Date()
                  : null,
            },
          });
        }

        const project = await transaction.project.create({
          data: {
            proposalId: interest.proposalId,
            industryId,
            status: "COLLABORATION_CONFIRMED",
            startedAt: new Date(),
            statusHistory: {
              create: {
                newStatus: "COLLABORATION_CONFIRMED",
                actorUserId: userId,
                reason: "Industry collaboration project created",
              },
            },
          },
        });
        await transaction.industryCollaboration.update({
          where: { id: collaboration.id },
          data: {
            status: "CONFIRMED",
            projectId: project.id,
            confirmedAt: new Date(),
          },
        });
        await transaction.industryProposalInterest.update({
          where: { id: interest.id },
          data: { status: IndustryProposalInterestStatus.ACCEPTED },
        });
        await transaction.industryProposalInterest.updateMany({
          where: {
            proposalId: interest.proposalId,
            id: { not: interest.id },
            status: {
              in: [
                IndustryProposalInterestStatus.EXPRESSED,
                IndustryProposalInterestStatus.UNDER_REVIEW,
              ],
            },
          },
          data: { status: IndustryProposalInterestStatus.REJECTED },
        });
        await transitionProblemInTransaction(transaction, {
          problemId: interest.proposal.problem.id,
          from: ProblemStatus.INDUSTRY_ACCEPTED,
          to: ProblemStatus.COLLABORATION_CONFIRMED,
          actor: "INDUSTRY",
          actorUserId: userId,
          reason: "Industry collaboration was confirmed and project created",
          metadata: {
            source: "industry",
            collaborationId: collaboration.id,
            projectId: project.id,
          },
        });
        await notifyCollaborationConfirmed(
          transaction,
          interest.proposalId,
          project.id,
        );

        return transaction.industryCollaboration.findUniqueOrThrow({
          where: { id: collaboration.id },
          include: collaborationInclude,
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "Another industry has already accepted this proposal",
          409,
          "PROPOSAL_COLLABORATION_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  listCollaborationsForIndustry(
    userId: string,
  ): Promise<IndustryCollaborationRecord[]> {
    return this.client.industryCollaboration.findMany({
      where: { industry: { users: { some: { id: userId } } } },
      include: collaborationInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  listProjectsForIndustry(userId: string): Promise<IndustryProjectRecord[]> {
    return this.client.project.findMany({
      where: { industry: { users: { some: { id: userId } } } },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
  }
}

function eligibleProposalWhere(
  query: IndustryProposalQueryInput,
): Prisma.ProposalWhereInput {
  const problemWhere: Prisma.ProblemWhereInput = {
    currentStatus: {
      in: [ProblemStatus.PROPOSAL_SUBMITTED, ProblemStatus.INDUSTRY_REVIEW],
    },
  };
  const where: Prisma.ProposalWhereInput = {
    status: {
      in: [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_INDUSTRY_REVIEW],
    },
    problem: problemWhere,
    university: { isApproved: true },
  };

  if (query.universityId) where.universityId = query.universityId;
  if (query.minBudget !== undefined || query.maxBudget !== undefined) {
    where.estimatedBudget = {
      gte: query.minBudget,
      lte: query.maxBudget,
    };
  }
  if (query.supportType) {
    where.requestedSupportTypes = { has: query.supportType };
  }
  if (query.domain) {
    problemWhere.OR = [
      { category: { name: { contains: query.domain, mode: "insensitive" } } },
      { title: { contains: query.domain, mode: "insensitive" } },
      { description: { contains: query.domain, mode: "insensitive" } },
    ];
  }
  const textFilters: Prisma.ProposalWhereInput[] = [];
  if (query.technology) {
    textFilters.push({
      OR: [
        {
          technicalApproach: {
            contains: query.technology,
            mode: "insensitive",
          },
        },
        {
          solutionSummary: { contains: query.technology, mode: "insensitive" },
        },
        { innovation: { contains: query.technology, mode: "insensitive" } },
        {
          requestedSupport: {
            contains: query.technology,
            mode: "insensitive",
          },
        },
      ],
    });
  }
  if (query.requiredExpertise) {
    textFilters.push({
      OR: [
        {
          problemUnderstanding: {
            contains: query.requiredExpertise,
            mode: "insensitive",
          },
        },
        {
          technicalApproach: {
            contains: query.requiredExpertise,
            mode: "insensitive",
          },
        },
        {
          requiredResources: {
            contains: query.requiredExpertise,
            mode: "insensitive",
          },
        },
      ],
    });
  }
  if (textFilters.length) where.AND = textFilters;
  return where;
}

async function requireApprovedIndustry(
  transaction: Prisma.TransactionClient,
  userId: string,
): Promise<string> {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: { industry: { select: { id: true, isApproved: true } } },
  });
  if (!user?.industry?.isApproved) {
    throw new AppError(
      "An approved industry organization is required",
      403,
      "INDUSTRY_ORGANIZATION_REQUIRED",
    );
  }
  return user.industry.id;
}

function eligibleProposalNotFoundError(): AppError {
  return new AppError(
    "Submitted proposal is not available for industry collaboration",
    404,
    "ELIGIBLE_PROPOSAL_NOT_FOUND",
  );
}

function proposalUnavailableError(): AppError {
  return new AppError(
    "This proposal is no longer available for industry collaboration",
    409,
    "PROPOSAL_NO_LONGER_AVAILABLE",
  );
}

function interestNotFoundError(): AppError {
  return new AppError(
    "Proposal interest not found",
    404,
    "PROPOSAL_INTEREST_NOT_FOUND",
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

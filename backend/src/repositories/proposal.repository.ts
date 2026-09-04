import {
  AssignmentStatus,
  Prisma,
  ProblemStatus,
  ProposalStatus,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import type { ProposalDraftInput } from "../types/collaboration.js";
import { AppError } from "../utils/appError.js";
import { transitionProblemInTransaction } from "./problem-lifecycle.repository.js";
import { notifyProposalSubmitted } from "../services/notificationEvents.js";

const proposalInclude = {
  team: { select: { id: true, name: true } },
  collaborations: {
    select: {
      id: true,
      supportType: true,
      status: true,
      supportSummary: true,
      confirmedAt: true,
      createdAt: true,
      industry: { select: { id: true, name: true } },
      fundingRecords: {
        select: {
          id: true,
          fundingType: true,
          status: true,
          amount: true,
          currencyCode: true,
          conditionsNotes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export type ProposalRecord = Prisma.ProposalGetPayload<{
  include: typeof proposalInclude;
}>;

export class ProposalRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findForUniversity(
    userId: string,
    assignmentId: string,
  ): Promise<ProposalRecord | null> {
    return this.client.proposal.findFirst({
      where: {
        projectContext: {
          assignment: {
            id: assignmentId,
            status: AssignmentStatus.ACCEPTED,
            university: { users: { some: { id: userId } } },
          },
        },
      },
      include: proposalInclude,
    });
  }

  async saveDraft(
    userId: string,
    assignmentId: string,
    input: ProposalDraftInput,
  ): Promise<ProposalRecord> {
    return this.client.$transaction(async (transaction) => {
      const context = await findAcceptedContext(
        transaction,
        userId,
        assignmentId,
      );
      const problem = await transaction.problem.findUnique({
        where: { id: context.problemId },
        select: { currentStatus: true },
      });
      if (
        !problem ||
        !proposalEditableStatuses.includes(problem.currentStatus)
      ) {
        throw new AppError(
          "A proposal cannot be edited at the current project stage",
          409,
          "PROPOSAL_EDIT_NOT_AVAILABLE",
        );
      }

      const existing = await transaction.proposal.findUnique({
        where: { projectContextId: context.projectContextId },
        select: { id: true, status: true },
      });
      if (
        existing?.status !== undefined &&
        existing.status !== ProposalStatus.DRAFT
      ) {
        throw new AppError(
          "A submitted proposal cannot be edited",
          409,
          "PROPOSAL_ALREADY_SUBMITTED",
        );
      }

      const data = proposalData(input);
      const proposal = existing
        ? await transaction.proposal.update({
            where: { id: existing.id },
            data,
          })
        : await transaction.proposal.create({
            data: {
              ...data,
              problemId: context.problemId,
              universityId: context.universityId,
              projectContextId: context.projectContextId,
              teamId: context.teamId,
              status: ProposalStatus.DRAFT,
            },
          });

      if (problem.currentStatus === ProblemStatus.TEAM_FORMED) {
        await transitionProblemInTransaction(transaction, {
          problemId: context.problemId,
          from: ProblemStatus.TEAM_FORMED,
          to: ProblemStatus.PROPOSAL_DRAFT,
          actor: "UNIVERSITY",
          actorUserId: userId,
          reason: "University started a proposal draft",
          metadata: { source: "university", proposalId: proposal.id },
        });
      }

      return transaction.proposal.findUniqueOrThrow({
        where: { id: proposal.id },
        include: proposalInclude,
      });
    });
  }

  async submitForUniversity(
    userId: string,
    assignmentId: string,
  ): Promise<ProposalRecord> {
    return this.client.$transaction(async (transaction) => {
      const context = await findAcceptedContext(
        transaction,
        userId,
        assignmentId,
      );
      const proposal = await transaction.proposal.findUnique({
        where: { projectContextId: context.projectContextId },
        select: { id: true, status: true },
      });
      if (!proposal) {
        throw new AppError(
          "Create a proposal draft before submitting",
          409,
          "PROPOSAL_DRAFT_REQUIRED",
        );
      }
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new AppError(
          "Only a draft proposal can be submitted",
          409,
          "PROPOSAL_SUBMISSION_NOT_AVAILABLE",
        );
      }

      await transaction.proposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.SUBMITTED, submittedAt: new Date() },
      });
      await transitionProblemInTransaction(transaction, {
        problemId: context.problemId,
        from: ProblemStatus.PROPOSAL_DRAFT,
        to: ProblemStatus.PROPOSAL_SUBMITTED,
        actor: "UNIVERSITY",
        actorUserId: userId,
        reason: "University submitted a solution proposal",
        metadata: { source: "university", proposalId: proposal.id },
      });
      await notifyProposalSubmitted(
        transaction,
        proposal.id,
        context.problemId,
      );

      return transaction.proposal.findUniqueOrThrow({
        where: { id: proposal.id },
        include: proposalInclude,
      });
    });
  }

  listSubmittedForIndustry() {
    return this.client.proposal.findMany({
      where: { status: ProposalStatus.SUBMITTED },
      select: {
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
          },
        },
        university: { select: { id: true, name: true, shortName: true } },
        team: {
          select: { id: true, name: true, members: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }
}

async function findAcceptedContext(
  transaction: Prisma.TransactionClient,
  userId: string,
  assignmentId: string,
) {
  const context = await transaction.universityProjectContext.findFirst({
    where: {
      assignment: {
        id: assignmentId,
        status: AssignmentStatus.ACCEPTED,
        university: { users: { some: { id: userId } } },
      },
    },
    select: {
      id: true,
      problemId: true,
      universityId: true,
      team: { select: { id: true } },
    },
  });
  if (!context || !context.team) {
    throw new AppError(
      "Form a university team before creating a proposal",
      409,
      "TEAM_REQUIRED",
    );
  }
  return {
    projectContextId: context.id,
    problemId: context.problemId,
    universityId: context.universityId,
    teamId: context.team.id,
  };
}

function proposalData(input: ProposalDraftInput) {
  return {
    title: input.title,
    problemUnderstanding: input.problemUnderstanding,
    solutionSummary: input.solutionSummary,
    technicalApproach: input.technicalApproach ?? null,
    innovation: input.innovation ?? null,
    expectedOutcomes: input.expectedOutcomes ?? null,
    requiredResources: input.requiredResources ?? null,
    estimatedBudget: input.estimatedBudget ?? null,
    timeline: input.timeline ?? null,
    prototypePlan: input.prototypePlan ?? null,
    pilotPlan: input.pilotPlan ?? null,
    implementationPlan: input.implementationPlan ?? null,
    expectedSocialImpact: input.expectedSocialImpact ?? null,
    requestedSupport: input.requestedSupport ?? null,
    requestedSupportTypes: input.requestedSupportTypes ?? [],
  };
}

const proposalEditableStatuses: readonly ProblemStatus[] = [
  ProblemStatus.TEAM_FORMED,
  ProblemStatus.PROPOSAL_DRAFT,
] as const;

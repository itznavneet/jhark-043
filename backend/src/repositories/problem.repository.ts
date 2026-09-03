import { Prisma, type PrismaClient, ProblemStatus } from "@prisma/client";
import { database } from "../config/database.js";
import {
  canActorTransitionProblem,
  type ProblemTransitionActor,
} from "../domain/lifecycle.js";
import type { CreateProblemInput, ProblemListQuery } from "../types/problem.js";
import { AppError } from "../utils/appError.js";
import {
  notifyProblemLifecycle,
  notifyProblemSubmitted,
} from "../services/notificationEvents.js";

const problemListInclude = {
  category: { select: { id: true, name: true, description: true } },
  evidence: { orderBy: { createdAt: "asc" as const } },
  submitter: {
    select: {
      type: true,
      displayName: true,
      organizationName: true,
    },
  },
} as const;

const problemDetailInclude = {
  ...problemListInclude,
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: {
      actor: { select: { id: true, displayName: true, role: true } },
    },
  },
} as const;

const ministryHiddenStatuses: ProblemStatus[] = [
  ProblemStatus.SUBMITTED,
  ProblemStatus.AI_VALIDATED,
  ProblemStatus.AI_REJECTED,
];

export type ProblemListRecord = Prisma.ProblemGetPayload<{
  include: typeof problemListInclude;
}>;
export type ProblemDetailRecord = Prisma.ProblemGetPayload<{
  include: typeof problemDetailInclude;
}>;

export class ProblemRepository {
  constructor(private readonly client: PrismaClient = database) {}

  async createProblem(
    submitterUserId: string,
    input: CreateProblemInput,
  ): Promise<ProblemDetailRecord> {
    return this.client.$transaction(async (transaction) => {
      const category = await transaction.problemCategory.upsert({
        where: { name: input.category },
        update: {},
        create: { name: input.category },
      });

      const problem = await transaction.problem.create({
        data: {
          submitter: { connect: { userId: submitterUserId } },
          category: { connect: { id: category.id } },
          title: input.title,
          description: input.description,
          societalContext: input.societalContext ?? null,
          geography: input.location ?? null,
          district: input.district ?? null,
          block: input.block ?? null,
          villageLocality: input.villageLocality ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          priority: input.priority ?? null,
          desiredOutcome: input.desiredOutcome ?? null,
          supportingInformation: input.supportingInformation ?? null,
          currentStatus: ProblemStatus.SUBMITTED,
          evidence: {
            create: input.evidence.map((item) => ({
              type: item.type,
              title: item.title,
              description: item.description ?? null,
              fileName: item.fileName ?? null,
              storageKey: item.storageKey ?? null,
              mimeType: item.mimeType ?? null,
              fileSizeBytes: item.fileSizeBytes ?? null,
              externalUrl: item.externalUrl ?? null,
            })),
          },
          statusHistory: {
            create: {
              actorUserId: submitterUserId,
              oldStatus: null,
              newStatus: ProblemStatus.SUBMITTED,
              reason: "Problem submitted",
              metadata: { source: "submitter" },
            },
          },
        },
      });

      await notifyProblemSubmitted(transaction, problem.id, submitterUserId);

      return transaction.problem.findUniqueOrThrow({
        where: { id: problem.id },
        include: problemDetailInclude,
      });
    });
  }

  listProblems(
    viewer: { ministry: true } | { submitterUserId: string },
    query: ProblemListQuery,
  ): Promise<ProblemListRecord[]> {
    return this.client.problem.findMany({
      where: {
        ...("ministry" in viewer
          ? {}
          : { submitter: { userId: viewer.submitterUserId } }),
        ...("ministry" in viewer
          ? {
              currentStatus:
                query.status &&
                !new Set(ministryHiddenStatuses).has(query.status)
                  ? query.status
                  : {
                      notIn: ministryHiddenStatuses,
                    },
            }
          : query.status
            ? { currentStatus: query.status }
            : {}),
        ...(query.category
          ? {
              category: {
                name: { equals: query.category, mode: "insensitive" },
              },
            }
          : {}),
        ...(query.district
          ? { district: { equals: query.district, mode: "insensitive" } }
          : {}),
        ...(query.block
          ? { block: { equals: query.block, mode: "insensitive" } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: problemListInclude,
    });
  }

  findProblemById(
    problemId: string,
    viewer: { ministry: true } | { submitterUserId: string },
  ): Promise<ProblemDetailRecord | null> {
    return this.client.problem.findFirst({
      where: {
        id: problemId,
        ...("ministry" in viewer
          ? { currentStatus: { notIn: ministryHiddenStatuses } }
          : { submitter: { userId: viewer.submitterUserId } }),
      },
      include: problemDetailInclude,
    });
  }

  async transitionProblem(
    problemId: string,
    actorUserId: string,
    actorRole: ProblemTransitionActor,
    newStatus: ProblemStatus,
    reason?: string,
  ): Promise<ProblemDetailRecord> {
    return this.client.$transaction(async (transaction) => {
      const current = await transaction.problem.findUnique({
        where: { id: problemId },
        select: { currentStatus: true },
      });

      if (!current) {
        throw new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
      }

      if (
        !canActorTransitionProblem(current.currentStatus, newStatus, actorRole)
      ) {
        throw new AppError(
          `Transition from ${current.currentStatus} to ${newStatus} is not allowed`,
          409,
          "INVALID_PROBLEM_TRANSITION",
        );
      }

      const updated = await transaction.problem.updateMany({
        where: { id: problemId, currentStatus: current.currentStatus },
        data: { currentStatus: newStatus },
      });

      if (updated.count !== 1) {
        throw new AppError(
          "The problem changed before this transition could be applied",
          409,
          "PROBLEM_TRANSITION_CONFLICT",
        );
      }

      await transaction.problemStatusHistory.create({
        data: {
          problemId,
          actorUserId,
          oldStatus: current.currentStatus,
          newStatus,
          reason: reason ?? null,
        },
      });
      await notifyProblemLifecycle(transaction, problemId, newStatus, reason);

      return transaction.problem.findUniqueOrThrow({
        where: { id: problemId },
        include: problemDetailInclude,
      });
    });
  }
}

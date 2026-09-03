import { Prisma, ProblemStatus, type PrismaClient } from "@prisma/client";
import { database } from "../config/database.js";
import { notifyProblemThresholdReached } from "../services/notificationEvents.js";
import { AppError } from "../utils/appError.js";

const communityInclude = {
  category: { select: { id: true, name: true } },
  submitter: { select: { userId: true } },
  upvotes: { select: { id: true }, where: { userId: undefined } },
  _count: { select: { upvotes: true } },
} as const;

export type CommunityProblemRecord = Prisma.ProblemGetPayload<{
  include: typeof communityInclude;
}>;

export class CommunityRepository {
  constructor(private readonly client: PrismaClient = database) {}

  listValidatedProblems(userId: string): Promise<CommunityProblemRecord[]> {
    return this.client.problem.findMany({
      where: { currentStatus: ProblemStatus.AI_VALIDATED },
      include: {
        ...communityInclude,
        upvotes: { where: { userId }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async upvote(
    problemId: string,
    userId: string,
    threshold: number,
  ): Promise<CommunityProblemRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const problem = await transaction.problem.findUnique({
          where: { id: problemId },
          select: {
            currentStatus: true,
            title: true,
            submitter: { select: { userId: true } },
          },
        });
        if (!problem) throw problemNotFoundError();
        if (problem.currentStatus !== ProblemStatus.AI_VALIDATED) {
          throw new AppError(
            "Only AI-validated community problems can receive support",
            409,
            "COMMUNITY_PROBLEM_NOT_AVAILABLE",
          );
        }
        if (problem.submitter.userId === userId) {
          throw new AppError(
            "You cannot support your own problem",
            403,
            "OWN_PROBLEM_UPVOTE_FORBIDDEN",
          );
        }

        await transaction.problemUpvote.create({ data: { problemId, userId } });
        const count = await transaction.problemUpvote.count({
          where: { problemId },
        });
        if (count >= threshold) {
          const updated = await transaction.problem.updateMany({
            where: {
              id: problemId,
              currentStatus: ProblemStatus.AI_VALIDATED,
            },
            data: { currentStatus: ProblemStatus.MINISTRY_REVIEW },
          });
          if (updated.count === 1) {
            await transaction.problemStatusHistory.create({
              data: {
                problemId,
                actorUserId: null,
                oldStatus: ProblemStatus.AI_VALIDATED,
                newStatus: ProblemStatus.MINISTRY_REVIEW,
                reason: "Community support threshold reached",
                metadata: {
                  source: "community_upvotes",
                  upvoteCount: count,
                  threshold,
                },
              },
            });
            await notifyProblemThresholdReached(
              transaction,
              problemId,
              count,
              threshold,
            );
          }
        }
        return transaction.problem.findUniqueOrThrow({
          where: { id: problemId },
          include: {
            ...communityInclude,
            upvotes: { where: { userId }, select: { id: true } },
          },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "You have already supported this problem",
          409,
          "DUPLICATE_PROBLEM_UPVOTE",
        );
      }
      throw error;
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function problemNotFoundError(): AppError {
  return new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
}

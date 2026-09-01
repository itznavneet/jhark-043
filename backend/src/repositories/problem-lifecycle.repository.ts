import { Prisma, ProblemStatus } from "@prisma/client";
import {
  canActorTransitionProblem,
  type ProblemTransitionActor,
} from "../domain/lifecycle.js";
import { AppError } from "../utils/appError.js";

export async function transitionProblemInTransaction(
  transaction: Prisma.TransactionClient,
  input: {
    problemId: string;
    from: ProblemStatus;
    to: ProblemStatus;
    actorUserId?: string;
    actor: ProblemTransitionActor;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!canActorTransitionProblem(input.from, input.to, input.actor)) {
    throw new AppError(
      `Transition from ${input.from} to ${input.to} is not allowed`,
      409,
      "INVALID_PROBLEM_TRANSITION",
    );
  }

  const updated = await transaction.problem.updateMany({
    where: { id: input.problemId, currentStatus: input.from },
    data: { currentStatus: input.to },
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
      problemId: input.problemId,
      actorUserId: input.actorUserId ?? null,
      oldStatus: input.from,
      newStatus: input.to,
      reason: input.reason ?? null,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

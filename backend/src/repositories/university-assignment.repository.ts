import {
  AssignmentStatus,
  MatchDecision,
  NotificationType,
  Prisma,
  ProblemStatus,
  UserRole,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import { transitionProblemInTransaction } from "./problem-lifecycle.repository.js";
import { AppError } from "../utils/appError.js";
import {
  notifyProblemParticipants,
  notifyUniversityInvitation,
} from "../services/notificationEvents.js";
import { notifyRole } from "../services/notification.service.js";

const assignmentInclude = {
  problem: {
    select: {
      id: true,
      title: true,
      description: true,
      currentStatus: true,
      geography: true,
      district: true,
      block: true,
      desiredOutcome: true,
      category: { select: { id: true, name: true } },
    },
  },
  university: { select: { id: true, name: true, shortName: true } },
  projectContext: { select: { id: true } },
} as const;

export type AssignmentRecord = Prisma.UniversityProblemAssignmentGetPayload<{
  include: typeof assignmentInclude;
}>;

export class UniversityAssignmentRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findUniversityForUser(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId },
      select: {
        university: { select: { id: true, name: true, isApproved: true } },
      },
    });
  }

  async sendInvitations(
    problemId: string,
    matchIds: string[],
    ministryUserId: string,
  ): Promise<AssignmentRecord[]> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const problem = await transaction.problem.findUnique({
          where: { id: problemId },
          select: { currentStatus: true },
        });
        if (!problem) throw problemNotFoundError();
        if (
          problem.currentStatus !== ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES
        ) {
          throw new AppError(
            "University invitations require Ministry-approved recommendations",
            409,
            "INVITATIONS_NOT_AVAILABLE",
          );
        }

        const matches = await transaction.problemUniversityMatch.findMany({
          where: {
            id: { in: matchIds },
            problemId,
            decision: MatchDecision.APPROVED,
            university: { isApproved: true },
          },
          select: { id: true, universityId: true },
        });
        if (matches.length !== matchIds.length) {
          throw new AppError(
            "One or more approved university recommendations are unavailable",
            409,
            "INVITATION_RECOMMENDATION_CONFLICT",
          );
        }

        await transaction.universityProblemAssignment.createMany({
          data: matches.map((match) => ({
            problemId,
            universityId: match.universityId,
            matchId: match.id,
            status: AssignmentStatus.INVITED,
            invitedAt: new Date(),
          })),
        });
        for (const match of matches) {
          await notifyUniversityInvitation(
            transaction,
            problemId,
            match.universityId,
          );
        }

        await transitionProblemInTransaction(transaction, {
          problemId,
          from: ProblemStatus.MINISTRY_APPROVED_UNIVERSITIES,
          to: ProblemStatus.INVITATIONS_SENT,
          actor: "MINISTRY_ADMIN",
          actorUserId: ministryUserId,
          reason: "Ministry sent university invitations",
          metadata: { source: "ministry", invitationCount: matches.length },
        });

        return transaction.universityProblemAssignment.findMany({
          where: { problemId },
          include: assignmentInclude,
          orderBy: { createdAt: "asc" },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "An invitation already exists for one of the selected universities",
          409,
          "INVITATION_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  listForMinistry(problemId: string): Promise<AssignmentRecord[]> {
    return this.client.universityProblemAssignment.findMany({
      where: { problemId },
      include: assignmentInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  listForUniversity(userId: string): Promise<AssignmentRecord[]> {
    return this.client.universityProblemAssignment.findMany({
      where: {
        university: { users: { some: { id: userId } } },
      },
      include: assignmentInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findForUniversity(
    userId: string,
    assignmentId: string,
  ): Promise<AssignmentRecord | null> {
    return this.client.universityProblemAssignment.findFirst({
      where: {
        id: assignmentId,
        university: { users: { some: { id: userId } } },
      },
      include: assignmentInclude,
    });
  }

  async acceptForUniversity(
    userId: string,
    assignmentId: string,
  ): Promise<AssignmentRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const assignment =
          await transaction.universityProblemAssignment.findFirst({
            where: {
              id: assignmentId,
              status: AssignmentStatus.INVITED,
              university: { users: { some: { id: userId } } },
            },
            select: { id: true, problemId: true, universityId: true },
          });
        if (!assignment) throw assignmentUnavailableError();

        const accepted =
          await transaction.universityProblemAssignment.updateMany({
            where: {
              id: assignment.id,
              universityId: assignment.universityId,
              status: AssignmentStatus.INVITED,
            },
            data: {
              status: AssignmentStatus.ACCEPTED,
              respondedAt: new Date(),
              responseNote: "University accepted the invitation",
            },
          });
        if (accepted.count !== 1) throw assignmentUnavailableError();

        await transitionProblemInTransaction(transaction, {
          problemId: assignment.problemId,
          from: ProblemStatus.INVITATIONS_SENT,
          to: ProblemStatus.UNIVERSITY_ACCEPTED,
          actor: "UNIVERSITY",
          actorUserId: userId,
          reason: "University accepted the invitation",
          metadata: { source: "university", assignmentId: assignment.id },
        });

        await transaction.universityProblemAssignment.updateMany({
          where: {
            problemId: assignment.problemId,
            id: { not: assignment.id },
            status: {
              in: [AssignmentStatus.PENDING, AssignmentStatus.INVITED],
            },
          },
          data: {
            status: AssignmentStatus.CANCELLED,
            respondedAt: new Date(),
            responseNote: "Cancelled because another university accepted",
          },
        });

        await transaction.universityProjectContext.create({
          data: {
            problemId: assignment.problemId,
            universityId: assignment.universityId,
            assignmentId: assignment.id,
          },
        });
        await notifyProblemParticipants(
          transaction,
          assignment.problemId,
          "University accepted",
          "A university accepted your problem and will form a collaboration team.",
        );
        await notifyRole(transaction, UserRole.MINISTRY_ADMIN, {
          type: NotificationType.COLLABORATION_UPDATE,
          title: "University accepted a problem",
          message:
            "A university accepted an invitation and a project context was created.",
          relatedEntityType: "PROBLEM",
          relatedEntityId: assignment.problemId,
        });

        return transaction.universityProblemAssignment.findUniqueOrThrow({
          where: { id: assignment.id },
          include: assignmentInclude,
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "Another university has already accepted this problem",
          409,
          "UNIVERSITY_ACCEPTANCE_CONFLICT",
        );
      }
      throw error;
    }
  }

  async rejectForUniversity(
    userId: string,
    assignmentId: string,
    reason?: string,
  ): Promise<AssignmentRecord> {
    return this.client.$transaction(async (transaction) => {
      const assignment =
        await transaction.universityProblemAssignment.findFirst({
          where: {
            id: assignmentId,
            status: AssignmentStatus.INVITED,
            university: { users: { some: { id: userId } } },
          },
          select: { id: true, problemId: true },
        });
      if (!assignment) throw assignmentUnavailableError();

      await transaction.universityProblemAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.REJECTED,
          respondedAt: new Date(),
          responseNote: reason ?? "University rejected the invitation",
        },
      });

      const remaining = await transaction.universityProblemAssignment.count({
        where: {
          problemId: assignment.problemId,
          status: { in: [AssignmentStatus.PENDING, AssignmentStatus.INVITED] },
        },
      });
      if (remaining === 0) {
        await transitionProblemInTransaction(transaction, {
          problemId: assignment.problemId,
          from: ProblemStatus.INVITATIONS_SENT,
          to: ProblemStatus.UNIVERSITY_REJECTED,
          actor: "UNIVERSITY",
          actorUserId: userId,
          reason: reason ?? "All invited universities rejected the problem",
          metadata: { source: "university", assignmentId: assignment.id },
        });
      }
      await notifyProblemParticipants(
        transaction,
        assignment.problemId,
        "University invitation rejected",
        "A university rejected an invitation for your problem.",
      );
      await notifyRole(transaction, UserRole.MINISTRY_ADMIN, {
        type: NotificationType.COLLABORATION_UPDATE,
        title: "University invitation rejected",
        message:
          "A university rejected an invitation for a problem under review.",
        relatedEntityType: "PROBLEM",
        relatedEntityId: assignment.problemId,
      });

      return transaction.universityProblemAssignment.findUniqueOrThrow({
        where: { id: assignment.id },
        include: assignmentInclude,
      });
    });
  }
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function problemNotFoundError(): AppError {
  return new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
}

function assignmentUnavailableError(): AppError {
  return new AppError(
    "This invitation is no longer available",
    409,
    "ASSIGNMENT_NOT_AVAILABLE",
  );
}

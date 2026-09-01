import {
  AssignmentStatus,
  Prisma,
  ProblemStatus,
  TeamMemberType,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import type { TeamInput } from "../types/collaboration.js";
import { AppError } from "../utils/appError.js";
import { transitionProblemInTransaction } from "./problem-lifecycle.repository.js";
import { notifyProblemParticipants } from "../services/notificationEvents.js";

const teamInclude = {
  members: { orderBy: { createdAt: "asc" as const } },
} as const;

export type TeamRecord = Prisma.ProjectTeamGetPayload<{
  include: typeof teamInclude;
}>;

export class UniversityTeamRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findForUniversity(
    userId: string,
    assignmentId: string,
  ): Promise<TeamRecord | null> {
    return this.client.projectTeam.findFirst({
      where: {
        projectContext: {
          assignment: {
            id: assignmentId,
            status: AssignmentStatus.ACCEPTED,
            university: { users: { some: { id: userId } } },
          },
        },
      },
      include: teamInclude,
    });
  }

  async saveForUniversity(
    userId: string,
    assignmentId: string,
    input: TeamInput,
  ): Promise<TeamRecord> {
    return this.client.$transaction(async (transaction) => {
      const assignment =
        await transaction.universityProblemAssignment.findFirst({
          where: {
            id: assignmentId,
            status: AssignmentStatus.ACCEPTED,
            university: { users: { some: { id: userId } } },
          },
          select: {
            problemId: true,
            universityId: true,
            projectContext: { select: { id: true } },
          },
        });
      if (!assignment?.projectContext) {
        throw new AppError(
          "Only the accepted university can manage a team",
          403,
          "TEAM_ACCESS_DENIED",
        );
      }

      const problem = await transaction.problem.findUnique({
        where: { id: assignment.problemId },
        select: { currentStatus: true },
      });
      if (!problem || !teamEditableStatuses.includes(problem.currentStatus)) {
        throw new AppError(
          "The team cannot be changed at the current project stage",
          409,
          "TEAM_EDIT_NOT_AVAILABLE",
        );
      }

      const existing = await transaction.projectTeam.findUnique({
        where: { projectContextId: assignment.projectContext.id },
        select: { id: true },
      });
      const members = [
        {
          name: input.facultyMentor.name,
          memberType: TeamMemberType.FACULTY_MENTOR,
          roleTitle: input.facultyMentor.roleTitle ?? null,
          department: input.facultyMentor.department ?? null,
          email: input.facultyMentor.email ?? null,
          userId: input.facultyMentor.userId ?? null,
        },
        ...input.members.map((member) => ({
          name: member.name,
          memberType: member.memberType,
          roleTitle: member.roleTitle ?? null,
          department: member.department ?? null,
          email: member.email ?? null,
          userId: member.userId ?? null,
        })),
      ];

      let teamId: string;
      if (existing) {
        teamId = existing.id;
        await transaction.projectTeam.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            description: input.description ?? null,
            members: {
              deleteMany: {},
              create: members,
            },
          },
        });
      } else {
        const team = await transaction.projectTeam.create({
          data: {
            problemId: assignment.problemId,
            universityId: assignment.universityId,
            projectContextId: assignment.projectContext.id,
            name: input.name,
            description: input.description ?? null,
            members: { create: members },
          },
        });
        teamId = team.id;
        if (problem.currentStatus === ProblemStatus.UNIVERSITY_ACCEPTED) {
          await transitionProblemInTransaction(transaction, {
            problemId: assignment.problemId,
            from: ProblemStatus.UNIVERSITY_ACCEPTED,
            to: ProblemStatus.TEAM_FORMED,
            actor: "UNIVERSITY",
            actorUserId: userId,
            reason: "University formed a project team",
            metadata: { source: "university", teamId },
          });
          await notifyProblemParticipants(
            transaction,
            assignment.problemId,
            "University team formed",
            "A university team has been formed to work on your problem.",
          );
        }
      }

      return transaction.projectTeam.findUniqueOrThrow({
        where: { id: teamId },
        include: teamInclude,
      });
    });
  }
}

const teamEditableStatuses: readonly ProblemStatus[] = [
  ProblemStatus.UNIVERSITY_ACCEPTED,
  ProblemStatus.TEAM_FORMED,
  ProblemStatus.PROPOSAL_DRAFT,
] as const;

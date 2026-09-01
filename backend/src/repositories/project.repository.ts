import {
  MilestoneStatus,
  Prisma,
  ProjectStatus,
  ProblemStatus,
  UserRole,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import { canActorTransitionProject } from "../domain/projectLifecycle.js";
import { transitionProblemInTransaction } from "./problem-lifecycle.repository.js";
import type {
  ImpactMeasurementInput,
  ProjectDocumentInput,
  ProjectMilestoneInput,
  ProjectTransitionInput,
  ProjectUpdateInput,
} from "../types/project.js";
import { AppError } from "../utils/appError.js";
import { notifyProjectStakeholders } from "../services/notificationEvents.js";

const projectInclude = {
  proposal: {
    select: {
      id: true,
      title: true,
      status: true,
      problem: {
        select: {
          id: true,
          title: true,
          currentStatus: true,
          submitter: { select: { userId: true } },
        },
      },
      university: { select: { id: true, name: true, shortName: true } },
      team: { select: { id: true, name: true } },
    },
  },
  industry: { select: { id: true, name: true } },
  milestones: { orderBy: { sequence: "asc" as const } },
  updates: {
    orderBy: { createdAt: "desc" as const },
    include: {
      milestone: { select: { id: true, title: true } },
      documents: true,
    },
  },
  documents: {
    where: { updateId: null },
    orderBy: { createdAt: "desc" as const },
  },
  impactMeasures: { orderBy: { measuredAt: "desc" as const } },
  collaborations: {
    include: {
      industry: { select: { id: true, name: true } },
      fundingRecords: true,
    },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: { actor: { select: { id: true, displayName: true, role: true } } },
  },
} as const;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export class ProjectRepository {
  constructor(private readonly client: PrismaClient = database) {}

  listForUser(userId: string, role: UserRole): Promise<ProjectRecord[]> {
    return this.client.project.findMany({
      where: accessWhere(userId, role),
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  findForUser(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<ProjectRecord | null> {
    return this.client.project.findFirst({
      where: { id: projectId, ...accessWhere(userId, role) },
      include: projectInclude,
    });
  }

  async transitionForUniversity(
    projectId: string,
    userId: string,
    input: ProjectTransitionInput,
  ): Promise<ProjectRecord> {
    return this.client.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: projectId, ...accessWhere(userId, UserRole.UNIVERSITY) },
        select: {
          id: true,
          status: true,
          proposal: {
            select: { problem: { select: { id: true, currentStatus: true } } },
          },
        },
      });
      if (!project) throw projectNotFoundError();
      if (
        !canActorTransitionProject(
          project.status,
          input.status,
          UserRole.UNIVERSITY,
        )
      ) {
        throw new AppError(
          `Project transition from ${project.status} to ${input.status} is not allowed`,
          409,
          "INVALID_PROJECT_TRANSITION",
        );
      }

      const updated = await transaction.project.updateMany({
        where: { id: project.id, status: project.status },
        data: {
          status: input.status,
          completedAt:
            input.status === ProjectStatus.COMPLETED ? new Date() : null,
        },
      });
      if (updated.count !== 1) throw projectTransitionConflictError();

      const mirroredTransition = mirroredProblemTransition(
        project.status,
        input.status,
      );
      if (mirroredTransition) {
        await transitionProblemInTransaction(transaction, {
          problemId: project.proposal.problem.id,
          from: mirroredTransition.from,
          to: mirroredTransition.to,
          actor: "UNIVERSITY",
          actorUserId: userId,
          reason: input.reason ?? `Project moved to ${input.status}`,
          metadata: { source: "project", projectId },
        });
      }
      await transaction.projectStatusHistory.create({
        data: {
          projectId,
          actorUserId: userId,
          oldStatus: project.status,
          newStatus: input.status,
          reason: input.reason ?? null,
        },
      });
      await notifyProjectStakeholders(
        transaction,
        projectId,
        input.status === ProjectStatus.COMPLETED
          ? "Project completed"
          : "Project status updated",
        `The project moved to ${input.status.replaceAll("_", " ")}.`,
        input.status,
      );
      return transaction.project.findUniqueOrThrow({
        where: { id: projectId },
        include: projectInclude,
      });
    });
  }

  async createMilestone(
    projectId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ) {
    return this.client.$transaction(async (transaction) => {
      await requireUniversityProject(transaction, projectId, userId);
      const lastMilestone = await transaction.projectMilestone.findFirst({
        where: { projectId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const milestone = await transaction.projectMilestone.create({
        data: milestoneData(
          projectId,
          input,
          undefined,
          (lastMilestone?.sequence ?? 0) + 1,
        ),
      });
      await notifyProjectStakeholders(
        transaction,
        projectId,
        "Project milestone update",
        `A new milestone was added: ${milestone.title}.`,
      );
      return milestone;
    });
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ) {
    return this.client.$transaction(async (transaction) => {
      await requireUniversityProject(transaction, projectId, userId);
      const existing = await transaction.projectMilestone.findFirst({
        where: { id: milestoneId, projectId },
      });
      if (!existing) throw milestoneNotFoundError();
      const milestone = await transaction.projectMilestone.update({
        where: { id: milestoneId },
        data: milestoneData(projectId, input, existing),
      });
      await notifyProjectStakeholders(
        transaction,
        projectId,
        "Project milestone update",
        `Milestone updated: ${milestone.title}.`,
      );
      return milestone;
    });
  }

  async createUpdate(
    projectId: string,
    userId: string,
    input: ProjectUpdateInput,
  ) {
    return this.client.$transaction(async (transaction) => {
      await requireUniversityProject(transaction, projectId, userId);
      if (input.milestoneId) {
        const milestone = await transaction.projectMilestone.findFirst({
          where: { id: input.milestoneId, projectId },
          select: { id: true },
        });
        if (!milestone) throw milestoneNotFoundError();
      }
      const update = await transaction.projectUpdate.create({
        data: {
          projectId,
          authorUserId: userId,
          milestoneId: input.milestoneId ?? null,
          title: input.title,
          content: input.description,
          progressPercentage: input.progressPercentage ?? null,
          createdAt: input.date ? new Date(input.date) : undefined,
        },
      });
      if (input.documents?.length) {
        await transaction.projectDocument.createMany({
          data: input.documents.map((document) =>
            documentData(projectId, document, update.id),
          ),
        });
      }
      await notifyProjectStakeholders(
        transaction,
        projectId,
        "Project milestone update",
        `A progress update was posted: ${update.title}.`,
      );
      return transaction.projectUpdate.findUniqueOrThrow({
        where: { id: update.id },
        include: { milestone: true, documents: true },
      });
    });
  }

  async createDocument(
    projectId: string,
    userId: string,
    input: ProjectDocumentInput,
  ) {
    await requireUniversityProject(this.client, projectId, userId);
    const document = await this.client.projectDocument.create({
      data: documentData(projectId, input),
    });
    await notifyProjectStakeholders(
      this.client,
      projectId,
      "Project document added",
      `A project document was added: ${document.title}.`,
    );
    return document;
  }

  async upsertImpact(
    projectId: string,
    userId: string,
    input: ImpactMeasurementInput,
  ) {
    await requireUniversityProject(this.client, projectId, userId);
    const impact = await this.client.impactMeasurement.upsert({
      where: {
        projectId_metricName: { projectId, metricName: input.metricName },
      },
      update: impactData(input),
      create: { projectId, metricName: input.metricName, ...impactData(input) },
    });
    await notifyProjectStakeholders(
      this.client,
      projectId,
      "Project milestone update",
      `Impact measurement updated: ${impact.metricName}.`,
    );
    return impact;
  }
}

function accessWhere(userId: string, role: UserRole): Prisma.ProjectWhereInput {
  if (role === UserRole.MINISTRY_ADMIN) return {};
  if (role === UserRole.UNIVERSITY) {
    return { proposal: { university: { users: { some: { id: userId } } } } };
  }
  if (role === UserRole.INDUSTRY) {
    return {
      OR: [
        { industry: { users: { some: { id: userId } } } },
        {
          collaborations: {
            some: { industry: { users: { some: { id: userId } } } },
          },
        },
      ],
    };
  }
  return { proposal: { problem: { submitter: { user: { id: userId } } } } };
}

async function requireUniversityProject(
  client: PrismaClient | Prisma.TransactionClient,
  projectId: string,
  userId: string,
) {
  const project = await client.project.findFirst({
    where: { id: projectId, ...accessWhere(userId, UserRole.UNIVERSITY) },
    select: { id: true, status: true },
  });
  if (!project) throw projectNotFoundError();
  if (
    project.status === ProjectStatus.COMPLETED ||
    project.status === ProjectStatus.CANCELLED
  ) {
    throw new AppError(
      "Completed or cancelled projects cannot be changed",
      409,
      "PROJECT_NOT_EDITABLE",
    );
  }
  return project;
}

function milestoneData(
  projectId: string,
  input: ProjectMilestoneInput,
  existing?: { status: MilestoneStatus; completionPercentage: number },
  sequence?: number,
) {
  const completionPercentage =
    input.status === MilestoneStatus.COMPLETED
      ? 100
      : (input.completionPercentage ?? existing?.completionPercentage ?? 0);
  return {
    projectId,
    sequence: sequence ?? 1,
    title: input.title,
    description: input.description ?? null,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    status: input.status ?? existing?.status ?? MilestoneStatus.PLANNED,
    completionPercentage,
    deliverables: input.deliverables ?? [],
    completedAt: input.status === MilestoneStatus.COMPLETED ? new Date() : null,
  };
}

function documentData(
  projectId: string,
  input: ProjectDocumentInput,
  updateId?: string,
) {
  return {
    projectId,
    updateId: updateId ?? null,
    type: input.type,
    title: input.title,
    storageKey: input.storageKey ?? null,
    externalUrl: input.externalUrl ?? null,
    mimeType: input.mimeType ?? null,
    fileSizeBytes: input.fileSizeBytes ?? null,
  };
}

function impactData(input: ImpactMeasurementInput) {
  return {
    description: input.description ?? null,
    baseline: input.baseline ?? null,
    target: input.target ?? null,
    actual: input.currentValue ?? null,
    peopleBenefited: input.peopleBenefited ?? null,
    locationsCovered: input.locationsCovered ?? null,
    unit: input.unit ?? null,
    measuredAt: input.measuredAt ? new Date(input.measuredAt) : null,
    evidence: input.evidence ?? null,
    notes: input.notes ?? null,
  };
}

function mirroredProblemTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): { from: ProblemStatus; to: ProblemStatus } | null {
  const transitions: Partial<
    Record<
      ProjectStatus,
      Partial<Record<ProjectStatus, { from: ProblemStatus; to: ProblemStatus }>>
    >
  > = {
    [ProjectStatus.COLLABORATION_CONFIRMED]: {
      [ProjectStatus.PROTOTYPE_DEVELOPMENT]: {
        from: ProblemStatus.COLLABORATION_CONFIRMED,
        to: ProblemStatus.PROTOTYPE_DEVELOPMENT,
      },
    },
    [ProjectStatus.PROTOTYPE_DEVELOPMENT]: {
      [ProjectStatus.FIELD_PILOT]: {
        from: ProblemStatus.PROTOTYPE_DEVELOPMENT,
        to: ProblemStatus.FIELD_PILOT,
      },
    },
    [ProjectStatus.FIELD_PILOT]: {
      [ProjectStatus.IMPLEMENTATION]: {
        from: ProblemStatus.FIELD_PILOT,
        to: ProblemStatus.IMPLEMENTATION,
      },
    },
    [ProjectStatus.IMPLEMENTATION]: {
      [ProjectStatus.IMPACT_MEASURED]: {
        from: ProblemStatus.IMPLEMENTATION,
        to: ProblemStatus.IMPACT_MEASURED,
      },
    },
    [ProjectStatus.IMPACT_MEASURED]: {
      [ProjectStatus.COMPLETED]: {
        from: ProblemStatus.IMPACT_MEASURED,
        to: ProblemStatus.COMPLETED,
      },
    },
  };
  return transitions[from]?.[to] ?? null;
}

function projectNotFoundError(): AppError {
  return new AppError("Project not found", 404, "PROJECT_NOT_FOUND");
}

function milestoneNotFoundError(): AppError {
  return new AppError(
    "Project milestone not found",
    404,
    "MILESTONE_NOT_FOUND",
  );
}

function projectTransitionConflictError(): AppError {
  return new AppError(
    "The project changed before this transition could be applied",
    409,
    "PROJECT_TRANSITION_CONFLICT",
  );
}

import {
  ProjectRepository,
  type ProjectRecord,
} from "../repositories/project.repository.js";
import type {
  ImpactMeasurementInput,
  ProjectDocumentInput,
  ProjectMilestoneInput,
  ProjectTransitionInput,
  ProjectUpdateInput,
} from "../types/project.js";
import type { UserRole } from "@prisma/client";
import { AppError } from "../utils/appError.js";

export interface ProjectServiceContract {
  listProjects(userId: string, role: UserRole): Promise<unknown[]>;
  getProject(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<unknown>;
  transitionProject(
    projectId: string,
    userId: string,
    input: ProjectTransitionInput,
  ): Promise<unknown>;
  createMilestone(
    projectId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ): Promise<unknown>;
  updateMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ): Promise<unknown>;
  createUpdate(
    projectId: string,
    userId: string,
    input: ProjectUpdateInput,
  ): Promise<unknown>;
  createDocument(
    projectId: string,
    userId: string,
    input: ProjectDocumentInput,
  ): Promise<unknown>;
  upsertImpact(
    projectId: string,
    userId: string,
    input: ImpactMeasurementInput,
  ): Promise<unknown>;
}

export class ProjectService implements ProjectServiceContract {
  constructor(private readonly repository = new ProjectRepository()) {}

  async listProjects(userId: string, role: UserRole): Promise<unknown[]> {
    return (await this.repository.listForUser(userId, role)).map((project) =>
      toProjectView(project, role),
    );
  }

  async getProject(
    projectId: string,
    userId: string,
    role: UserRole,
  ): Promise<unknown> {
    const project = await this.repository.findForUser(projectId, userId, role);
    if (!project)
      throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");
    return toProjectView(project, role);
  }

  async transitionProject(
    projectId: string,
    userId: string,
    input: ProjectTransitionInput,
  ) {
    return toProjectView(
      await this.repository.transitionForUniversity(projectId, userId, input),
      "UNIVERSITY",
    );
  }
  async createMilestone(
    projectId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ) {
    return toMilestoneView(
      await this.repository.createMilestone(projectId, userId, input),
    );
  }
  async updateMilestone(
    projectId: string,
    milestoneId: string,
    userId: string,
    input: ProjectMilestoneInput,
  ) {
    return toMilestoneView(
      await this.repository.updateMilestone(
        projectId,
        milestoneId,
        userId,
        input,
      ),
    );
  }
  async createUpdate(
    projectId: string,
    userId: string,
    input: ProjectUpdateInput,
  ) {
    return toUpdateView(
      await this.repository.createUpdate(projectId, userId, input),
    );
  }
  async createDocument(
    projectId: string,
    userId: string,
    input: ProjectDocumentInput,
  ) {
    return toDocumentView(
      await this.repository.createDocument(projectId, userId, input),
    );
  }
  async upsertImpact(
    projectId: string,
    userId: string,
    input: ImpactMeasurementInput,
  ) {
    return toImpactView(
      await this.repository.upsertImpact(projectId, userId, input),
    );
  }
}

function toMilestoneView(
  item: Awaited<ReturnType<ProjectRepository["createMilestone"]>>,
) {
  return {
    ...item,
    dueDate: item.dueDate?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
  };
}

function toUpdateView(
  item: Awaited<ReturnType<ProjectRepository["createUpdate"]>>,
) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    documents: item.documents.map(toDocumentView),
  };
}

function toImpactView(
  item: Awaited<ReturnType<ProjectRepository["upsertImpact"]>>,
) {
  return {
    ...item,
    baseline: item.baseline?.toNumber() ?? null,
    target: item.target?.toNumber() ?? null,
    actual: item.actual?.toNumber() ?? null,
    measuredAt: item.measuredAt?.toISOString() ?? null,
  };
}

function toProjectView(project: ProjectRecord, role: UserRole) {
  const full = {
    id: project.id,
    status: project.status,
    startedAt: project.startedAt?.toISOString() ?? null,
    completedAt: project.completedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    proposal: project.proposal,
    industry: project.industry,
    milestones: project.milestones.map((item) => ({
      ...item,
      dueDate: item.dueDate?.toISOString() ?? null,
      completedAt: item.completedAt?.toISOString() ?? null,
    })),
    updates: project.updates.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      documents: item.documents.map(toDocumentView),
    })),
    documents: project.documents.map(toDocumentView),
    impactMeasures: project.impactMeasures.map((item) => ({
      ...item,
      baseline: item.baseline?.toNumber() ?? null,
      target: item.target?.toNumber() ?? null,
      actual: item.actual?.toNumber() ?? null,
      measuredAt: item.measuredAt?.toISOString() ?? null,
    })),
    collaborations: project.collaborations,
    statusHistory: project.statusHistory.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
  if (role !== "SUBMITTER") return full;
  return {
    id: full.id,
    status: full.status,
    startedAt: full.startedAt,
    completedAt: full.completedAt,
    problem: {
      id: project.proposal.problem.id,
      title: project.proposal.problem.title,
    },
    university: project.proposal.university,
    milestones: full.milestones.map(
      ({ id, title, status, completionPercentage, dueDate }) => ({
        id,
        title,
        status,
        completionPercentage,
        dueDate,
      }),
    ),
    updates: full.updates.map(
      ({ id, title, createdAt, progressPercentage }) => ({
        id,
        title,
        createdAt,
        progressPercentage,
      }),
    ),
    statusHistory: full.statusHistory,
  };
}

function toDocumentView(document: ProjectRecord["documents"][number]) {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    fileSizeBytes:
      document.fileSizeBytes === null ? null : Number(document.fileSizeBytes),
  };
}

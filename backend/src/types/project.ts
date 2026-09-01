import type {
  MilestoneStatus,
  ProjectDocumentType,
  ProjectStatus,
} from "@prisma/client";

export interface ProjectTransitionInput {
  status: ProjectStatus;
  reason?: string;
}

export interface ProjectMilestoneInput {
  title: string;
  description?: string;
  dueDate?: string;
  status?: MilestoneStatus;
  completionPercentage?: number;
  deliverables?: string[];
}

export interface ProjectUpdateDocumentInput {
  type: ProjectDocumentType;
  title: string;
  storageKey?: string;
  externalUrl?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}

export interface ProjectUpdateInput {
  title: string;
  description: string;
  progressPercentage?: number;
  milestoneId?: string;
  date?: string;
  documents?: ProjectUpdateDocumentInput[];
}

export type ProjectDocumentInput = ProjectUpdateDocumentInput;

export interface ImpactMeasurementInput {
  metricName: string;
  description?: string;
  baseline?: number;
  target?: number;
  currentValue?: number;
  peopleBenefited?: number;
  locationsCovered?: number;
  unit?: string;
  measuredAt?: string;
  evidence?: string;
  notes?: string;
}

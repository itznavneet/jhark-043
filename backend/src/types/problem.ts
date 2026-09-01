import type {
  ProblemPriority,
  ProblemStatus,
  ProblemEvidenceType,
} from "@prisma/client";

export interface ProblemEvidenceInput {
  type: ProblemEvidenceType;
  title: string;
  description?: string;
  fileName?: string;
  storageKey?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  externalUrl?: string;
}

export interface CreateProblemInput {
  title: string;
  description: string;
  category: string;
  societalContext?: string;
  location?: string;
  district?: string;
  block?: string;
  villageLocality?: string;
  latitude?: number;
  longitude?: number;
  priority?: ProblemPriority;
  desiredOutcome?: string;
  supportingInformation?: string;
  evidence: ProblemEvidenceInput[];
}

export interface ProblemListQuery {
  status?: ProblemStatus;
  category?: string;
  district?: string;
  block?: string;
}

export interface ProblemTransitionInput {
  newStatus: ProblemStatus;
  reason?: string;
}

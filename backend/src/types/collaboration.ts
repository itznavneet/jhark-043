import type {
  AssignmentStatus,
  ProblemStatus,
  ProposalStatus,
  IndustrySupportType,
  TeamMemberType,
} from "@prisma/client";

export interface SendInvitationsInput {
  matchIds: string[];
}

export interface RejectAssignmentInput {
  reason?: string;
}

export interface TeamMemberInput {
  name: string;
  memberType: Extract<TeamMemberType, "RESEARCH_STUDENT" | "OTHER">;
  roleTitle?: string;
  department?: string;
  email?: string;
  userId?: string;
}

export interface TeamInput {
  name: string;
  description?: string;
  facultyMentor: {
    name: string;
    roleTitle?: string;
    department?: string;
    email?: string;
    userId?: string;
  };
  members: TeamMemberInput[];
}

export interface ProposalDraftInput {
  title: string;
  problemUnderstanding: string;
  solutionSummary: string;
  technicalApproach?: string;
  innovation?: string;
  expectedOutcomes?: string;
  requiredResources?: string;
  estimatedBudget?: number;
  timeline?: string;
  prototypePlan?: string;
  pilotPlan?: string;
  implementationPlan?: string;
  expectedSocialImpact?: string;
  requestedSupport?: string;
  requestedSupportTypes?: IndustrySupportType[];
}

export interface AssignmentSummary {
  id: string;
  status: AssignmentStatus;
  invitedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  problem: {
    id: string;
    title: string;
    description: string;
    currentStatus: ProblemStatus;
    category: { id: string; name: string } | null;
    location: string | null;
    district: string | null;
    block: string | null;
    desiredOutcome: string | null;
  };
  university: { id: string; name: string; shortName: string | null };
}

export interface TeamView {
  id: string;
  name: string;
  description: string | null;
  formedAt: string;
  members: Array<{
    id: string;
    name: string;
    memberType: TeamMemberType;
    roleTitle: string | null;
    department: string | null;
    email: string | null;
  }>;
}

export interface ProposalView extends ProposalDraftInput {
  id: string;
  problemId: string;
  universityId: string;
  teamId: string | null;
  status: ProposalStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

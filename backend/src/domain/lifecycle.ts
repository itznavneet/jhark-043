import type { UserRole } from "@prisma/client";

export const problemStatuses = [
  "SUBMITTED",
  "AI_VALIDATED",
  "AI_REJECTED",
  "MINISTRY_REVIEW",
  "MINISTRY_APPROVED",
  "MINISTRY_REJECTED",
  "AI_UNIVERSITY_MATCHED",
  "UNIVERSITIES_RECOMMENDED",
  "MINISTRY_APPROVED_UNIVERSITIES",
  "INVITATIONS_SENT",
  "UNIVERSITY_ACCEPTED",
  "UNIVERSITY_REJECTED",
  "TEAM_FORMED",
  "PROPOSAL_DRAFT",
  "PROPOSAL_SUBMITTED",
  "INDUSTRY_REVIEW",
  "INDUSTRY_ACCEPTED",
  "INDUSTRY_REJECTED",
  "COLLABORATION_CONFIRMED",
  "PROTOTYPE_DEVELOPMENT",
  "FIELD_PILOT",
  "IMPLEMENTATION",
  "IMPACT_MEASURED",
  "COMPLETED",
] as const;

export type ProblemStatus = (typeof problemStatuses)[number];

export const assignmentStatuses = [
  "PENDING",
  "INVITED",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type AssignmentStatus = (typeof assignmentStatuses)[number];

export const registrationStatuses = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type RegistrationStatus = (typeof registrationStatuses)[number];

export const proposalStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_INDUSTRY_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export const industryCollaborationStatuses = [
  "PROPOSED",
  "ACCEPTED",
  "REJECTED",
  "CONFIRMED",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type IndustryCollaborationStatus =
  (typeof industryCollaborationStatuses)[number];

export const projectStatuses = [
  "INITIATED",
  "PROTOTYPE_DEVELOPMENT",
  "FIELD_PILOT",
  "IMPLEMENTATION",
  "IMPACT_MEASURED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const allowedProblemTransitions: Readonly<
  Record<ProblemStatus, readonly ProblemStatus[]>
> = {
  SUBMITTED: ["AI_VALIDATED", "AI_REJECTED", "MINISTRY_REVIEW"],
  AI_VALIDATED: ["MINISTRY_REVIEW"],
  AI_REJECTED: [],
  MINISTRY_REVIEW: ["MINISTRY_APPROVED", "MINISTRY_REJECTED"],
  MINISTRY_APPROVED: ["AI_UNIVERSITY_MATCHED"],
  MINISTRY_REJECTED: [],
  AI_UNIVERSITY_MATCHED: ["UNIVERSITIES_RECOMMENDED"],
  UNIVERSITIES_RECOMMENDED: ["MINISTRY_APPROVED_UNIVERSITIES"],
  MINISTRY_APPROVED_UNIVERSITIES: ["INVITATIONS_SENT"],
  INVITATIONS_SENT: ["UNIVERSITY_ACCEPTED", "UNIVERSITY_REJECTED"],
  UNIVERSITY_ACCEPTED: ["TEAM_FORMED"],
  UNIVERSITY_REJECTED: [],
  TEAM_FORMED: ["PROPOSAL_DRAFT"],
  PROPOSAL_DRAFT: ["PROPOSAL_SUBMITTED"],
  PROPOSAL_SUBMITTED: ["INDUSTRY_REVIEW"],
  INDUSTRY_REVIEW: ["INDUSTRY_ACCEPTED", "INDUSTRY_REJECTED"],
  INDUSTRY_ACCEPTED: ["COLLABORATION_CONFIRMED"],
  INDUSTRY_REJECTED: [],
  COLLABORATION_CONFIRMED: ["PROTOTYPE_DEVELOPMENT"],
  PROTOTYPE_DEVELOPMENT: ["FIELD_PILOT"],
  FIELD_PILOT: ["IMPLEMENTATION"],
  IMPLEMENTATION: ["IMPACT_MEASURED"],
  IMPACT_MEASURED: ["COMPLETED"],
  COMPLETED: [],
};

export function canTransitionProblem(
  currentStatus: ProblemStatus,
  nextStatus: ProblemStatus,
): boolean {
  return allowedProblemTransitions[currentStatus].includes(nextStatus);
}

export type ProblemTransitionActor = UserRole | "AI_SERVICE";

export const allowedProblemTransitionActors: Readonly<
  Partial<
    Record<
      ProblemStatus,
      Partial<Record<ProblemStatus, readonly ProblemTransitionActor[]>>
    >
  >
> = {
  SUBMITTED: {
    AI_VALIDATED: ["AI_SERVICE"],
    AI_REJECTED: ["AI_SERVICE"],
    MINISTRY_REVIEW: ["MINISTRY_ADMIN"],
  },
  AI_VALIDATED: {
    MINISTRY_REVIEW: ["MINISTRY_ADMIN"],
  },
  MINISTRY_REVIEW: {
    MINISTRY_APPROVED: ["MINISTRY_ADMIN"],
    MINISTRY_REJECTED: ["MINISTRY_ADMIN"],
  },
  AI_UNIVERSITY_MATCHED: {
    UNIVERSITIES_RECOMMENDED: ["AI_SERVICE"],
  },
  UNIVERSITIES_RECOMMENDED: {
    MINISTRY_APPROVED_UNIVERSITIES: ["MINISTRY_ADMIN"],
  },
  MINISTRY_APPROVED_UNIVERSITIES: {
    INVITATIONS_SENT: ["MINISTRY_ADMIN"],
  },
  INVITATIONS_SENT: {
    UNIVERSITY_ACCEPTED: ["UNIVERSITY"],
    UNIVERSITY_REJECTED: ["UNIVERSITY"],
  },
  UNIVERSITY_ACCEPTED: {
    TEAM_FORMED: ["UNIVERSITY"],
  },
  TEAM_FORMED: {
    PROPOSAL_DRAFT: ["UNIVERSITY"],
  },
  PROPOSAL_DRAFT: {
    PROPOSAL_SUBMITTED: ["UNIVERSITY"],
  },
  PROPOSAL_SUBMITTED: {
    INDUSTRY_REVIEW: ["INDUSTRY"],
  },
  INDUSTRY_REVIEW: {
    INDUSTRY_ACCEPTED: ["INDUSTRY"],
    INDUSTRY_REJECTED: ["INDUSTRY"],
  },
  INDUSTRY_ACCEPTED: {
    COLLABORATION_CONFIRMED: ["INDUSTRY"],
  },
  COLLABORATION_CONFIRMED: {
    PROTOTYPE_DEVELOPMENT: ["UNIVERSITY"],
  },
  PROTOTYPE_DEVELOPMENT: {
    FIELD_PILOT: ["UNIVERSITY"],
  },
  FIELD_PILOT: {
    IMPLEMENTATION: ["UNIVERSITY"],
  },
  IMPLEMENTATION: {
    IMPACT_MEASURED: ["UNIVERSITY"],
  },
  IMPACT_MEASURED: {
    COMPLETED: ["UNIVERSITY"],
  },
};

export function canActorTransitionProblem(
  currentStatus: ProblemStatus,
  nextStatus: ProblemStatus,
  actor: ProblemTransitionActor,
): boolean {
  return Boolean(
    canTransitionProblem(currentStatus, nextStatus) &&
    allowedProblemTransitionActors[currentStatus]?.[nextStatus]?.includes(
      actor,
    ),
  );
}

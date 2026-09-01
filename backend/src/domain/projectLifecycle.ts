import type { ProjectStatus, UserRole } from "@prisma/client";

export const projectStatuses = [
  "COLLABORATION_CONFIRMED",
  "INITIATED",
  "PROTOTYPE_DEVELOPMENT",
  "FIELD_PILOT",
  "IMPLEMENTATION",
  "IMPACT_MEASURED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const satisfies readonly ProjectStatus[];

export const allowedProjectTransitions: Readonly<
  Record<ProjectStatus, readonly ProjectStatus[]>
> = {
  COLLABORATION_CONFIRMED: ["PROTOTYPE_DEVELOPMENT", "ON_HOLD", "CANCELLED"],
  INITIATED: ["PROTOTYPE_DEVELOPMENT", "ON_HOLD", "CANCELLED"],
  PROTOTYPE_DEVELOPMENT: ["FIELD_PILOT", "ON_HOLD", "CANCELLED"],
  FIELD_PILOT: ["IMPLEMENTATION", "ON_HOLD", "CANCELLED"],
  IMPLEMENTATION: ["IMPACT_MEASURED", "ON_HOLD", "CANCELLED"],
  IMPACT_MEASURED: ["COMPLETED", "ON_HOLD", "CANCELLED"],
  COMPLETED: [],
  ON_HOLD: ["PROTOTYPE_DEVELOPMENT", "FIELD_PILOT", "IMPLEMENTATION"],
  CANCELLED: [],
};

export type ProjectTransitionActor = UserRole;

export function canTransitionProject(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
): boolean {
  return allowedProjectTransitions[currentStatus].includes(nextStatus);
}

export function canActorTransitionProject(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
  actor: ProjectTransitionActor,
): boolean {
  return (
    actor === "UNIVERSITY" && canTransitionProject(currentStatus, nextStatus)
  );
}

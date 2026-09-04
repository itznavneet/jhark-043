import {
  NotificationType,
  ProblemStatus,
  ProjectStatus,
  UserRole,
} from "@prisma/client";
import {
  NotificationRepository,
  type NotificationClient,
} from "../repositories/notification.repository.js";
import { notifyRole, notifyUsers } from "./notification.service.js";

const notificationRepository = (client: NotificationClient) =>
  new NotificationRepository(client);

export async function notifyProblemSubmitted(
  client: NotificationClient,
  problemId: string,
  submitterUserId: string,
) {
  await notifyUsers(client, [submitterUserId], {
    type: NotificationType.LIFECYCLE_UPDATE,
    title: "Problem submitted",
    message: "Your societal challenge was submitted for AI validation.",
    relatedEntityType: "PROBLEM",
    relatedEntityId: problemId,
  });
}

export async function notifyProblemThresholdReached(
  client: NotificationClient,
  problemId: string,
  upvoteCount: number,
  threshold: number,
) {
  const problem = await client.problem.findUnique({
    where: { id: problemId },
    select: { title: true, submitter: { select: { userId: true } } },
  });
  if (!problem) return;
  await notifyRole(client, UserRole.MINISTRY_ADMIN, {
    type: NotificationType.LIFECYCLE_UPDATE,
    title: "Problem ready for Ministry review",
    message: `${problem.title} reached the community support threshold (${upvoteCount}/${threshold}).`,
    relatedEntityType: "PROBLEM",
    relatedEntityId: problemId,
  });
  await notifyUsers(client, [problem.submitter.userId], {
    type: NotificationType.LIFECYCLE_UPDATE,
    title: "Problem reached support threshold",
    message:
      "Your validated problem has reached the community support threshold and is now with the Ministry for review.",
    relatedEntityType: "PROBLEM",
    relatedEntityId: problemId,
  });
}

export async function notifyProblemLifecycle(
  client: NotificationClient,
  problemId: string,
  status: ProblemStatus,
  reason?: string,
) {
  const problem = await client.problem.findUnique({
    where: { id: problemId },
    select: { title: true, submitter: { select: { userId: true } } },
  });
  if (!problem) return;

  const message = reason
    ? `${problem.title}: ${reason}`
    : `${problem.title} moved to ${status.replaceAll("_", " ")}.`;
  await notifyUsers(client, [problem.submitter.userId], {
    type: NotificationType.LIFECYCLE_UPDATE,
    title: `Problem ${status.replaceAll("_", " ").toLowerCase()}`,
    message,
    relatedEntityType: "PROBLEM",
    relatedEntityId: problemId,
    metadata: { status },
  });
}

export async function notifyAiAnalysisCompleted(
  client: NotificationClient,
  problemId: string,
  isSocietalProblem: boolean,
) {
  const problem = await client.problem.findUnique({
    where: { id: problemId },
    select: { submitter: { select: { userId: true } } },
  });
  if (!problem) return;
  await notifyUsers(client, [problem.submitter.userId], {
    type: NotificationType.LIFECYCLE_UPDATE,
    title: "Problem AI analysis completed",
    message: isSocietalProblem
      ? "AI analysis found this submission suitable for societal innovation review. Ministry approval is still required."
      : "AI analysis flagged this submission for Ministry review. Ministry remains the final decision-maker.",
    relatedEntityType: "PROBLEM",
    relatedEntityId: problemId,
  });
}

export async function notifyUniversityInvitation(
  client: NotificationClient,
  problemId: string,
  universityId: string,
) {
  const users =
    await notificationRepository(client).userIdsForUniversity(universityId);
  await notifyUsers(
    client,
    users.map((user) => user.id),
    {
      type: NotificationType.INVITATION,
      title: "University invitation",
      message:
        "Your university has been invited to collaborate on a societal challenge.",
      relatedEntityType: "PROBLEM",
      relatedEntityId: problemId,
    },
  );
}

export async function notifyProblemParticipants(
  client: NotificationClient,
  problemId: string,
  title: string,
  message: string,
  relatedType = "PROBLEM",
) {
  const problem = await client.problem.findUnique({
    where: { id: problemId },
    select: {
      submitter: { select: { userId: true } },
      proposals: {
        select: {
          university: {
            select: {
              users: { where: { isActive: true }, select: { id: true } },
            },
          },
        },
      },
    },
  });
  if (!problem) return;
  const universityUsers = problem.proposals.flatMap((proposal) =>
    proposal.university.users.map((user) => user.id),
  );
  await notifyUsers(client, [problem.submitter.userId, ...universityUsers], {
    type: NotificationType.LIFECYCLE_UPDATE,
    title,
    message,
    relatedEntityType: relatedType,
    relatedEntityId: problemId,
  });
}

export async function notifyProposalSubmitted(
  client: NotificationClient,
  proposalId: string,
  problemId: string,
) {
  await notifyProblemParticipants(
    client,
    problemId,
    "Proposal submitted",
    "A university has submitted a solution proposal for a problem you follow.",
    "PROPOSAL",
  );
  await notifyRole(client, UserRole.INDUSTRY, {
    type: NotificationType.PROPOSAL_INTEREST,
    title: "New proposal available",
    message:
      "A submitted university proposal is available for industry review.",
    relatedEntityType: "PROPOSAL",
    relatedEntityId: proposalId,
  });
}

export async function notifyIndustryInterest(
  client: NotificationClient,
  proposalId: string,
  interestId: string,
) {
  const proposal = await client.proposal.findUnique({
    where: { id: proposalId },
    select: { universityId: true },
  });
  if (!proposal) return;
  const users = await notificationRepository(client).userIdsForUniversity(
    proposal.universityId,
  );
  await notifyUsers(
    client,
    users.map((user) => user.id),
    {
      type: NotificationType.PROPOSAL_INTEREST,
      title: "Industry interest received",
      message:
        "An industry organization has expressed interest in your proposal.",
      relatedEntityType: "PROPOSAL",
      relatedEntityId: proposalId,
      metadata: { interestId },
    },
  );
}

export async function notifyCollaborationConfirmed(
  client: NotificationClient,
  proposalId: string,
  projectId: string,
) {
  const project = await client.project.findUnique({
    where: { id: projectId },
    select: {
      industryId: true,
      proposal: {
        select: {
          universityId: true,
          problem: { select: { submitter: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!project) return;
  const universityUsers = await notificationRepository(
    client,
  ).userIdsForUniversity(project.proposal.universityId);
  const ministryUsers = await notificationRepository(client).userIdsForRole(
    UserRole.MINISTRY_ADMIN,
  );
  const resolvedIndustryUsers = await projectIndustryUsers(
    client,
    project.industryId,
  );
  await notifyUsers(
    client,
    [
      ...universityUsers.map((user) => user.id),
      project.proposal.problem.submitter.userId,
      ...ministryUsers.map((user) => user.id),
      ...resolvedIndustryUsers.map((user) => user.id),
    ],
    {
      type: NotificationType.COLLABORATION_UPDATE,
      title: "Collaboration confirmed",
      message:
        "Industry support has been confirmed and the project is ready for delivery.",
      relatedEntityType: "PROJECT",
      relatedEntityId: projectId,
      metadata: { proposalId },
    },
  );
}

async function projectIndustryUsers(
  client: NotificationClient,
  industryId: string | null,
) {
  return industryId
    ? notificationRepository(client).userIdsForIndustry(industryId)
    : [];
}

export async function notifyProjectStakeholders(
  client: NotificationClient,
  projectId: string,
  title: string,
  message: string,
  status?: ProjectStatus,
) {
  const project = await client.project.findUnique({
    where: { id: projectId },
    select: {
      industryId: true,
      proposal: {
        select: {
          universityId: true,
          problem: { select: { submitter: { select: { userId: true } } } },
        },
      },
      collaborations: { select: { industryId: true } },
    },
  });
  if (!project) return;
  const repository = notificationRepository(client);
  const universityUsers = await repository.userIdsForUniversity(
    project.proposal.universityId,
  );
  const industryIds = [
    ...new Set([
      ...(project.industryId ? [project.industryId] : []),
      ...project.collaborations.map(
        (collaboration) => collaboration.industryId,
      ),
    ]),
  ];
  const industryUsers = (
    await Promise.all(
      industryIds.map((id) => repository.userIdsForIndustry(id)),
    )
  ).flat();
  const ministryUsers = await repository.userIdsForRole(
    UserRole.MINISTRY_ADMIN,
  );
  await notifyUsers(
    client,
    [
      ...universityUsers.map((user) => user.id),
      ...industryUsers.map((user) => user.id),
      project.proposal.problem.submitter.userId,
      ...ministryUsers.map((user) => user.id),
    ],
    {
      type: NotificationType.COLLABORATION_UPDATE,
      title,
      message,
      relatedEntityType: "PROJECT",
      relatedEntityId: projectId,
      metadata: status ? { status } : undefined,
    },
  );
}

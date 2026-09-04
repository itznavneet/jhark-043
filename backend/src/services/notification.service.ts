import {
  UserRole,
  type Notification,
  type NotificationType,
} from "@prisma/client";
import {
  NotificationRepository,
  type NotificationClient,
} from "../repositories/notification.repository.js";
import type { NotificationListQuery } from "../types/notification.js";
import type { AppEnvironment } from "../config/environment.js";
import { EmailNotificationService } from "./emailNotification.service.js";

const emailNotificationService = new EmailNotificationService();

const workflowRoles: UserRole[] = [
  UserRole.SUBMITTER,
  UserRole.UNIVERSITY,
  UserRole.INDUSTRY,
  UserRole.MINISTRY_ADMIN,
];

export function configureEmailNotifications(environment: AppEnvironment) {
  emailNotificationService.configure(environment);
}

export interface NotificationServiceContract {
  list(userId: string, query: NotificationListQuery): Promise<unknown[]>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, notificationId: string): Promise<unknown>;
  markAllRead(userId: string): Promise<{ count: number }>;
}

export class NotificationService implements NotificationServiceContract {
  constructor(private readonly repository = new NotificationRepository()) {}

  async list(userId: string, query: NotificationListQuery) {
    return (await this.repository.listForRecipient(userId, query)).map(toView);
  }

  unreadCount(userId: string) {
    return this.repository.countUnread(userId);
  }

  async markRead(userId: string, notificationId: string) {
    return toView(await this.repository.markRead(notificationId, userId));
  }

  markAllRead(userId: string) {
    return this.repository.markAllRead(userId);
  }
}

export async function notifyUsers(
  client: NotificationClient,
  recipientIds: string[],
  input: {
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const repository = new NotificationRepository(client);
  await repository.createForUsers(recipientIds, input);
  if (emailNotificationService.enabled) {
    const users = await repository.emailsForUsers(recipientIds);
    void emailNotificationService.send(
      users
        .filter((user) => shouldSendWorkflowEmail(input, user.role))
        .map((user) => ({
          recipientEmail: user.email,
          title: input.title,
          message: input.message,
        })),
    );
  }
}

/**
 * Keep email delivery focused on major workflow milestones. All events still
 * remain available as in-app notifications.
 */
export function shouldSendWorkflowEmail(
  input: {
    title: string;
    metadata?: Record<string, unknown>;
  },
  role: UserRole,
): boolean {
  const status = input.metadata?.status;
  if (input.title === "Problem submitted") {
    return role === UserRole.SUBMITTER;
  }
  if (input.title === "Problem ready for Ministry review") {
    return role === UserRole.MINISTRY_ADMIN;
  }
  if (input.title === "Proposal submitted") {
    return role === UserRole.SUBMITTER || role === UserRole.UNIVERSITY;
  }
  if (input.title === "New proposal available") {
    return role === UserRole.INDUSTRY;
  }
  if (input.title === "Collaboration confirmed") {
    return workflowRoles.includes(role);
  }
  if (
    (status === "IMPLEMENTATION" || status === "COMPLETED") &&
    input.title.startsWith("Project")
  ) {
    return workflowRoles.includes(role);
  }
  if (
    (status === "MINISTRY_APPROVED" || status === "MINISTRY_REJECTED") &&
    input.title.startsWith("Problem ")
  ) {
    return role === UserRole.SUBMITTER;
  }
  return false;
}

export async function notifyRole(
  client: NotificationClient,
  role: UserRole,
  input: Parameters<typeof notifyUsers>[2],
) {
  const users = await new NotificationRepository(client).userIdsForRole(role);
  await notifyUsers(
    client,
    users.map((user) => user.id),
    input,
  );
}

function toView(notification: Notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    read: notification.readAt !== null,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

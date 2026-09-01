import type { Notification, NotificationType, UserRole } from "@prisma/client";
import {
  NotificationRepository,
  type NotificationClient,
} from "../repositories/notification.repository.js";
import type { NotificationListQuery } from "../types/notification.js";

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
  await new NotificationRepository(client).createForUsers(recipientIds, input);
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

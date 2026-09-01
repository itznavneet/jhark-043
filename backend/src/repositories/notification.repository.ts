import {
  NotificationType,
  Prisma,
  UserRole,
  type PrismaClient,
} from "@prisma/client";
import { database } from "../config/database.js";
import type {
  CreateNotificationInput,
  NotificationListQuery,
} from "../types/notification.js";
import { AppError } from "../utils/appError.js";

export type NotificationClient = PrismaClient | Prisma.TransactionClient;

export class NotificationRepository {
  constructor(private readonly client: NotificationClient = database) {}

  listForRecipient(recipientId: string, query: NotificationListQuery = {}) {
    return this.client.notification.findMany({
      where: {
        recipientId,
        ...(query.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
    });
  }

  countUnread(recipientId: string) {
    return this.client.notification.count({
      where: { recipientId, readAt: null },
    });
  }

  async markRead(notificationId: string, recipientId: string) {
    const updated = await this.client.notification.updateMany({
      where: { id: notificationId, recipientId },
      data: { readAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new AppError(
        "Notification not found",
        404,
        "NOTIFICATION_NOT_FOUND",
      );
    }
    return this.client.notification.findUniqueOrThrow({
      where: { id: notificationId },
    });
  }

  markAllRead(recipientId: string) {
    return this.client.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  create(input: CreateNotificationInput) {
    return this.client.notification.create({ data: notificationData(input) });
  }

  createForUsers(
    recipientIds: string[],
    input: Omit<CreateNotificationInput, "recipientId">,
  ) {
    const uniqueIds = [...new Set(recipientIds)];
    if (!uniqueIds.length) return Promise.resolve({ count: 0 });
    return this.client.notification.createMany({
      data: uniqueIds.map((recipientId) =>
        notificationData({ ...input, recipientId }),
      ),
    });
  }

  userIdsForRole(role: UserRole) {
    return this.client.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });
  }

  userIdsForUniversity(universityId: string) {
    return this.client.user.findMany({
      where: { universityId, isActive: true },
      select: { id: true },
    });
  }

  userIdsForIndustry(industryId: string) {
    return this.client.user.findMany({
      where: { industryId, isActive: true },
      select: { id: true },
    });
  }
}

function notificationData(
  input: CreateNotificationInput,
): Prisma.NotificationUncheckedCreateInput {
  return {
    recipientId: input.recipientId,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    metadata: input.metadata
      ? (input.metadata as Prisma.InputJsonValue)
      : undefined,
  };
}

export function notificationTypeForProblemEvent(): NotificationType {
  return NotificationType.LIFECYCLE_UPDATE;
}

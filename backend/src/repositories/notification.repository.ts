import { randomUUID } from "node:crypto";
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
    const rows = uniqueIds.map(
      (recipientId) =>
        Prisma.sql`(${randomUUID()}::uuid, ${recipientId}::uuid, ${input.type}::"NotificationType", ${input.title}, ${input.message}, ${input.relatedEntityType ?? null}, ${input.relatedEntityId ?? null}::uuid, ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, ${new Date()})`,
    );
    return this.client
      .$executeRaw(
        Prisma.sql`INSERT INTO "Notification" ("id", "recipientId", "type", "title", "message", "relatedEntityType", "relatedEntityId", "metadata", "createdAt")
        SELECT row_data."id", row_data."recipientId", row_data."type", row_data."title", row_data."message", row_data."relatedEntityType", row_data."relatedEntityId", row_data."metadata", row_data."createdAt"
        FROM (VALUES ${Prisma.join(rows)}) AS row_data("id", "recipientId", "type", "title", "message", "relatedEntityType", "relatedEntityId", "metadata", "createdAt")
        INNER JOIN "User" recipient ON recipient."id" = row_data."recipientId" AND recipient."isActive" = true`,
      )
      .then((count) => ({ count }));
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

  emailsForUsers(userIds: string[]) {
    return this.client.user.findMany({
      where: { id: { in: [...new Set(userIds)] }, isActive: true },
      select: { email: true, role: true },
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

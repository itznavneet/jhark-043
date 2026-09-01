import type { NotificationType } from "@prisma/client";

export interface NotificationListQuery {
  limit?: number;
  unreadOnly?: boolean;
}

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

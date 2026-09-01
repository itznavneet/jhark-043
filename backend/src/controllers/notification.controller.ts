import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { NotificationServiceContract } from "../services/notification.service.js";
import type { NotificationListQuery } from "../types/notification.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createNotificationController(
  service: NotificationServiceContract,
): Record<string, RequestHandler> {
  return {
    list: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.list(
          request.auth!.userId,
          (request.validated?.query ?? {}) as NotificationListQuery,
        ),
      );
    }),
    unreadCount: asyncHandler(async (request, response) => {
      sendSuccess(response, {
        unreadCount: await service.unreadCount(request.auth!.userId),
      });
    }),
    markRead: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.markRead(
          request.auth!.userId,
          request.params.notificationId as string,
        ),
      );
    }),
    markAllRead: asyncHandler(async (request, response) => {
      sendSuccess(response, await service.markAllRead(request.auth!.userId));
    }),
  };
}

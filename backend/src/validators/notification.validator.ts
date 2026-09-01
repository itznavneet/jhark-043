import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  notificationId: z.uuid(),
});

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
    .default(false),
});

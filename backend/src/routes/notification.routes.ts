import { Router } from "express";
import type { AppEnvironment } from "../config/environment.js";
import { createNotificationController } from "../controllers/notification.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import {
  NotificationService,
  type NotificationServiceContract,
} from "../services/notification.service.js";
import { TokenService } from "../services/token.service.js";
import {
  notificationIdParamsSchema,
  notificationListQuerySchema,
} from "../validators/notification.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface NotificationRouteDependencies {
  service?: NotificationServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createNotificationRoutes(
  environment: AppEnvironment,
  dependencies: NotificationRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new NotificationService(new NotificationRepository());
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createNotificationController(service);
  const router = Router();

  router.get(
    "/",
    authenticate,
    validateRequest({ query: notificationListQuerySchema }),
    controller.list,
  );
  router.get("/unread-count", authenticate, controller.unreadCount);
  router.patch(
    "/:notificationId/read",
    authenticate,
    validateRequest({ params: notificationIdParamsSchema }),
    controller.markRead,
  );
  router.post("/read-all", authenticate, controller.markAllRead);

  return router;
}

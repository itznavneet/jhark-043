import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createAnalyticsController } from "../controllers/analytics.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import {
  AnalyticsService,
  type AnalyticsServiceContract,
} from "../services/analytics.service.js";
import { TokenService } from "../services/token.service.js";

export interface AnalyticsRouteDependencies {
  service?: AnalyticsServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createAnalyticsRoutes(
  environment: AppEnvironment,
  dependencies: AnalyticsRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createAnalyticsController(
    dependencies.service ?? new AnalyticsService(new AnalyticsRepository()),
  );
  const router = Router();
  router.get(
    "/ministry",
    authenticate,
    requireRole(UserRole.MINISTRY_ADMIN),
    controller,
  );
  return router;
}

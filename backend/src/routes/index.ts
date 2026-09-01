import { Router } from "express";
import type { AppEnvironment } from "../config/environment.js";
import type { HealthServiceContract } from "../services/health.service.js";
import { createAuthRoutes } from "./auth.routes.js";
import { createHealthRoutes } from "./health.routes.js";
import { createOrganizationRoutes } from "./organization.routes.js";
import { createRegistrationRoutes } from "./registration.routes.js";
import { createProblemRoutes } from "./problem.routes.js";
import { createProblemAiRoutes } from "./problemAi.routes.js";
import { createUniversityMatchingRoutes } from "./universityMatching.routes.js";
import { createUniversityCollaborationRoutes } from "./universityCollaboration.routes.js";
import { createIndustryCollaborationRoutes } from "./industryCollaboration.routes.js";
import { createProjectRoutes } from "./project.routes.js";
import { createNotificationRoutes } from "./notification.routes.js";
import { createAnalyticsRoutes } from "./analytics.routes.js";

export function createApiRoutes(
  environment: AppEnvironment,
  healthService: HealthServiceContract,
): Router {
  const router = Router();
  router.use("/auth", createAuthRoutes(environment));
  router.use("/registrations", createRegistrationRoutes(environment));
  router.use("/organizations", createOrganizationRoutes(environment));
  router.use("/problems", createProblemRoutes(environment));
  router.use("/problems", createProblemAiRoutes(environment));
  router.use(
    "/university-matching",
    createUniversityMatchingRoutes(environment),
  );
  router.use(
    "/collaboration",
    createUniversityCollaborationRoutes(environment),
  );
  router.use(
    "/collaboration/industry",
    createIndustryCollaborationRoutes(environment),
  );
  router.use("/projects", createProjectRoutes(environment));
  router.use("/notifications", createNotificationRoutes(environment));
  router.use("/analytics", createAnalyticsRoutes(environment));
  router.use("/health", createHealthRoutes(healthService));
  return router;
}

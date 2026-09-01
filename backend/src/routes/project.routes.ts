import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createProjectController } from "../controllers/project.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { ProjectRepository } from "../repositories/project.repository.js";
import {
  ProjectService,
  type ProjectServiceContract,
} from "../services/project.service.js";
import { TokenService } from "../services/token.service.js";
import { validateRequest } from "../validators/validate.js";
import {
  impactMeasurementSchema,
  projectDocumentSchema,
  projectIdParamsSchema,
  projectMilestoneIdParamsSchema,
  projectMilestoneSchema,
  projectTransitionSchema,
  projectUpdateSchema,
} from "../validators/project.validator.js";

export interface ProjectRouteDependencies {
  service?: ProjectServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createProjectRoutes(
  environment: AppEnvironment,
  dependencies: ProjectRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ?? new ProjectService(new ProjectRepository());
  const authenticate = createAuthenticate(tokenService, authRepository);
  const viewer = [
    authenticate,
    requireRole(
      UserRole.MINISTRY_ADMIN,
      UserRole.SUBMITTER,
      UserRole.UNIVERSITY,
      UserRole.INDUSTRY,
    ),
  ];
  const university = [authenticate, requireRole(UserRole.UNIVERSITY)];
  const controller = createProjectController(service);
  const router = Router();
  router.get("/", ...viewer, controller.list);
  router.get(
    "/:projectId",
    ...viewer,
    validateRequest({ params: projectIdParamsSchema }),
    controller.get,
  );
  router.post(
    "/:projectId/status",
    ...university,
    validateRequest({
      params: projectIdParamsSchema,
      body: projectTransitionSchema,
    }),
    controller.transition,
  );
  router.post(
    "/:projectId/milestones",
    ...university,
    validateRequest({
      params: projectIdParamsSchema,
      body: projectMilestoneSchema,
    }),
    controller.createMilestone,
  );
  router.put(
    "/:projectId/milestones/:milestoneId",
    ...university,
    validateRequest({
      params: projectMilestoneIdParamsSchema,
      body: projectMilestoneSchema,
    }),
    controller.updateMilestone,
  );
  router.post(
    "/:projectId/updates",
    ...university,
    validateRequest({
      params: projectIdParamsSchema,
      body: projectUpdateSchema,
    }),
    controller.createUpdate,
  );
  router.post(
    "/:projectId/documents",
    ...university,
    validateRequest({
      params: projectIdParamsSchema,
      body: projectDocumentSchema,
    }),
    controller.createDocument,
  );
  router.put(
    "/:projectId/impact",
    ...university,
    validateRequest({
      params: projectIdParamsSchema,
      body: impactMeasurementSchema,
    }),
    controller.upsertImpact,
  );
  return router;
}

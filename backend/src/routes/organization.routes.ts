import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createOrganizationController } from "../controllers/organization.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OrganizationRepository } from "../repositories/organization.repository.js";
import {
  OrganizationService,
  type OrganizationServiceContract,
} from "../services/organization.service.js";
import { TokenService } from "../services/token.service.js";
import {
  industryProfileSchema,
  universityProfileSchema,
} from "../validators/organization.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface OrganizationRouteDependencies {
  service?: OrganizationServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createOrganizationRoutes(
  environment: AppEnvironment,
  dependencies: OrganizationRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new OrganizationService(new OrganizationRepository());
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createOrganizationController(service);
  const router = Router();

  router.get(
    "/university/profile",
    authenticate,
    requireRole(UserRole.UNIVERSITY),
    controller.getUniversityProfile,
  );
  router.put(
    "/university/profile",
    authenticate,
    requireRole(UserRole.UNIVERSITY),
    validateRequest({ body: universityProfileSchema }),
    controller.updateUniversityProfile,
  );
  router.get(
    "/industry/profile",
    authenticate,
    requireRole(UserRole.INDUSTRY),
    controller.getIndustryProfile,
  );
  router.put(
    "/industry/profile",
    authenticate,
    requireRole(UserRole.INDUSTRY),
    validateRequest({ body: industryProfileSchema }),
    controller.updateIndustryProfile,
  );

  return router;
}

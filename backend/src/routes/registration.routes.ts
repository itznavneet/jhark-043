import { Router } from "express";
import { UserRole } from "@prisma/client";
import { createRegistrationController } from "../controllers/registration.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OrganizationRepository } from "../repositories/organization.repository.js";
import {
  RegistrationService,
  type RegistrationServiceContract,
} from "../services/registration.service.js";
import { TokenService } from "../services/token.service.js";
import {
  ministryCreateOrganizationSchema,
  registrationApplicationSchema,
  registrationListQuerySchema,
  rejectionSchema,
} from "../validators/organization.validator.js";
import { validateRequest } from "../validators/validate.js";
import type { AppEnvironment } from "../config/environment.js";

export interface RegistrationRouteDependencies {
  service?: RegistrationServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createRegistrationRoutes(
  environment: AppEnvironment,
  dependencies: RegistrationRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new RegistrationService(new OrganizationRepository());
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createRegistrationController(service);
  const ministry = [authenticate, requireRole(UserRole.MINISTRY_ADMIN)];
  const organizationRole = [
    authenticate,
    requireRole(UserRole.UNIVERSITY, UserRole.INDUSTRY),
  ];
  const router = Router();

  router.post(
    "/organizations",
    ...ministry,
    validateRequest({ body: ministryCreateOrganizationSchema }),
    controller.createOrganizationAccount,
  );
  router.post(
    "/applications",
    ...organizationRole,
    validateRequest({ body: registrationApplicationSchema }),
    controller.submitApplication,
  );
  router.get(
    "/applications",
    ...ministry,
    validateRequest({ query: registrationListQuerySchema }),
    controller.listApplications,
  );
  router.get(
    "/applications/:applicationId",
    ...ministry,
    controller.getApplication,
  );
  router.post(
    "/applications/:applicationId/approve",
    ...ministry,
    controller.approveApplication,
  );
  router.post(
    "/applications/:applicationId/reject",
    ...ministry,
    validateRequest({ body: rejectionSchema }),
    controller.rejectApplication,
  );

  return router;
}

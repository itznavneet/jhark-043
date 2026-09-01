import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createIndustryCollaborationController } from "../controllers/industryCollaboration.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { IndustryCollaborationRepository } from "../repositories/industryCollaboration.repository.js";
import { IndustryCollaborationService } from "../services/industryCollaboration.service.js";
import { TokenService } from "../services/token.service.js";
import {
  acceptIndustryInterestSchema,
  expressIndustryInterestSchema,
  industryInterestIdParamsSchema,
  industryProposalIdParamsSchema,
  industryProposalQuerySchema,
} from "../validators/collaboration.validator.js";
import { validateRequest } from "../validators/validate.js";
import type { IndustryCollaborationServiceContract } from "../services/industryCollaboration.service.js";

export interface IndustryCollaborationRouteDependencies {
  service?: IndustryCollaborationServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createIndustryCollaborationRoutes(
  environment: AppEnvironment,
  dependencies: IndustryCollaborationRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new IndustryCollaborationService(new IndustryCollaborationRepository());
  const authenticate = createAuthenticate(tokenService, authRepository);
  const industry = [authenticate, requireRole(UserRole.INDUSTRY)];
  const controller = createIndustryCollaborationController(service);
  const router = Router();

  router.get(
    "/proposals",
    ...industry,
    validateRequest({ query: industryProposalQuerySchema }),
    controller.proposals,
  );
  router.get(
    "/proposals/:proposalId",
    ...industry,
    validateRequest({ params: industryProposalIdParamsSchema }),
    controller.proposal,
  );
  router.post(
    "/proposals/:proposalId/interests",
    ...industry,
    validateRequest({
      params: industryProposalIdParamsSchema,
      body: expressIndustryInterestSchema,
    }),
    controller.expressInterest,
  );
  router.get("/interests", ...industry, controller.interests);
  router.post(
    "/interests/:interestId/accept",
    ...industry,
    validateRequest({
      params: industryInterestIdParamsSchema,
      body: acceptIndustryInterestSchema,
    }),
    controller.acceptInterest,
  );
  router.get("/collaborations", ...industry, controller.collaborations);
  router.get("/projects", ...industry, controller.projects);

  return router;
}

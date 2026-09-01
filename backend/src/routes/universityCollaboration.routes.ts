import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createUniversityCollaborationController } from "../controllers/universityCollaboration.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { ProposalRepository } from "../repositories/proposal.repository.js";
import { UniversityAssignmentRepository } from "../repositories/university-assignment.repository.js";
import { UniversityTeamRepository } from "../repositories/university-team.repository.js";
import {
  UniversityCollaborationService,
  type UniversityCollaborationServiceContract,
} from "../services/universityCollaboration.service.js";
import { TokenService } from "../services/token.service.js";
import {
  assignmentIdParamsSchema,
  collaborationProblemIdParamsSchema,
  proposalDraftSchema,
  rejectAssignmentSchema,
  sendInvitationsSchema,
  teamSchema,
} from "../validators/collaboration.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface UniversityCollaborationRouteDependencies {
  service?: UniversityCollaborationServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createUniversityCollaborationRoutes(
  environment: AppEnvironment,
  dependencies: UniversityCollaborationRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new UniversityCollaborationService(
      new UniversityAssignmentRepository(),
      new UniversityTeamRepository(),
      new ProposalRepository(),
    );
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createUniversityCollaborationController(service);
  const ministry = [authenticate, requireRole(UserRole.MINISTRY_ADMIN)];
  const university = [authenticate, requireRole(UserRole.UNIVERSITY)];
  const industry = [authenticate, requireRole(UserRole.INDUSTRY)];
  const router = Router();

  router.post(
    "/problems/:problemId/invitations",
    ...ministry,
    validateRequest({
      params: collaborationProblemIdParamsSchema,
      body: sendInvitationsSchema,
    }),
    controller.sendInvitations,
  );
  router.get(
    "/problems/:problemId/invitations",
    ...ministry,
    validateRequest({ params: collaborationProblemIdParamsSchema }),
    controller.ministryInvitations,
  );

  router.get("/university/assignments", ...university, controller.assignments);
  router.get(
    "/university/assignments/:assignmentId",
    ...university,
    validateRequest({ params: assignmentIdParamsSchema }),
    controller.assignment,
  );
  router.post(
    "/university/assignments/:assignmentId/accept",
    ...university,
    validateRequest({ params: assignmentIdParamsSchema }),
    controller.accept,
  );
  router.post(
    "/university/assignments/:assignmentId/reject",
    ...university,
    validateRequest({
      params: assignmentIdParamsSchema,
      body: rejectAssignmentSchema,
    }),
    controller.reject,
  );
  router.get(
    "/university/assignments/:assignmentId/team",
    ...university,
    validateRequest({ params: assignmentIdParamsSchema }),
    controller.team,
  );
  router.put(
    "/university/assignments/:assignmentId/team",
    ...university,
    validateRequest({
      params: assignmentIdParamsSchema,
      body: teamSchema,
    }),
    controller.saveTeam,
  );
  router.get(
    "/university/assignments/:assignmentId/proposal",
    ...university,
    validateRequest({ params: assignmentIdParamsSchema }),
    controller.proposal,
  );
  router.put(
    "/university/assignments/:assignmentId/proposal",
    ...university,
    validateRequest({
      params: assignmentIdParamsSchema,
      body: proposalDraftSchema,
    }),
    controller.saveProposal,
  );
  router.post(
    "/university/assignments/:assignmentId/proposal/submit",
    ...university,
    validateRequest({ params: assignmentIdParamsSchema }),
    controller.submitProposal,
  );

  router.get("/proposals", ...industry, controller.industryProposals);

  return router;
}

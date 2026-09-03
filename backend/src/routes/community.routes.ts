import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createCommunityController } from "../controllers/community.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { CommunityService } from "../services/community.service.js";
import { TokenService } from "../services/token.service.js";
import { problemIdParamsSchema } from "../validators/problem.validator.js";
import { validateRequest } from "../validators/validate.js";

export function createCommunityRoutes(environment: AppEnvironment): Router {
  const authenticate = createAuthenticate(
    new TokenService(environment),
    new AuthRepository(),
  );
  const controller = createCommunityController(
    new CommunityService(undefined, environment.upvoteThreshold ?? 3),
  );
  const submitter = [authenticate, requireRole(UserRole.SUBMITTER)];
  const router = Router();
  router.get("/problems", ...submitter, controller.list);
  router.post(
    "/problems/:problemId/upvote",
    ...submitter,
    validateRequest({ params: problemIdParamsSchema }),
    controller.upvote,
  );
  return router;
}

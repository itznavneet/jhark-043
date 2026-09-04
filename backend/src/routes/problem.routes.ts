import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { DevelopmentProblemAnalysisProvider } from "../ai/developmentProblemAnalysis.provider.js";
import { OpenAiProblemAnalysisProvider } from "../ai/openAiProblemAnalysis.provider.js";
import { createProblemController } from "../controllers/problem.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { ProblemAiRepository } from "../repositories/problem-ai.repository.js";
import { ProblemAiService } from "../services/problemAi.service.js";
import { DevelopmentEmbeddingProvider } from "../ai/developmentEmbedding.provider.js";
import { OpenAiEmbeddingProvider } from "../ai/openAiEmbedding.provider.js";
import { UniversityMatchingRepository } from "../repositories/university-matching.repository.js";
import { SemanticProblemDuplicateService } from "../services/problemDuplicate.service.js";
import {
  ProblemService,
  type ProblemServiceContract,
} from "../services/problem.service.js";
import { TokenService } from "../services/token.service.js";
import {
  createProblemSchema,
  problemIdParamsSchema,
  problemListQuerySchema,
  problemTransitionSchema,
} from "../validators/problem.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface ProblemRouteDependencies {
  service?: ProblemServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createProblemRoutes(
  environment: AppEnvironment,
  dependencies: ProblemRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new ProblemService(
      new ProblemRepository(),
      new ProblemAiService(
        new ProblemAiRepository(),
        environment.openAiApiKey
          ? new OpenAiProblemAnalysisProvider(environment)
          : new DevelopmentProblemAnalysisProvider(),
        new SemanticProblemDuplicateService(
          new UniversityMatchingRepository(),
          environment.openAiApiKey
            ? new OpenAiEmbeddingProvider(environment)
            : new DevelopmentEmbeddingProvider(),
        ),
      ),
    );
  const authenticate = createAuthenticate(tokenService, authRepository);
  const controller = createProblemController(service);
  const submitter = [authenticate, requireRole(UserRole.SUBMITTER)];
  const ministry = [authenticate, requireRole(UserRole.MINISTRY_ADMIN)];
  const viewer = [
    authenticate,
    requireRole(UserRole.MINISTRY_ADMIN, UserRole.SUBMITTER),
    validateRequest({ params: problemIdParamsSchema }),
  ];
  const router = Router();

  router.post(
    "/",
    ...submitter,
    validateRequest({ body: createProblemSchema }),
    controller.create,
  );
  router.get(
    "/mine",
    ...submitter,
    validateRequest({ query: problemListQuerySchema }),
    controller.listMine,
  );
  router.get(
    "/",
    ...ministry,
    validateRequest({ query: problemListQuerySchema }),
    controller.listAll,
  );
  router.get("/:problemId/timeline", ...viewer, controller.timeline);
  router.get("/:problemId", ...viewer, controller.get);
  router.post(
    "/:problemId/transition",
    ...ministry,
    validateRequest({
      params: problemIdParamsSchema,
      body: problemTransitionSchema,
    }),
    controller.transition,
  );

  return router;
}

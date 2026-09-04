import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { OpenAiProblemAnalysisProvider } from "../ai/openAiProblemAnalysis.provider.js";
import { DevelopmentProblemAnalysisProvider } from "../ai/developmentProblemAnalysis.provider.js";
import { DevelopmentEmbeddingProvider } from "../ai/developmentEmbedding.provider.js";
import { createProblemAiController } from "../controllers/problemAi.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { ProblemAiRepository } from "../repositories/problem-ai.repository.js";
import { UniversityMatchingRepository } from "../repositories/university-matching.repository.js";
import { OpenAiEmbeddingProvider } from "../ai/openAiEmbedding.provider.js";
import {
  ProblemAiService,
  type ProblemAiServiceContract,
} from "../services/problemAi.service.js";
import { SemanticProblemDuplicateService } from "../services/problemDuplicate.service.js";
import { TokenService } from "../services/token.service.js";
import { problemIdParamsSchema } from "../validators/problem.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface ProblemAiRouteDependencies {
  service?: ProblemAiServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createProblemAiRoutes(
  environment: AppEnvironment,
  dependencies: ProblemAiRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
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
    );
  const authenticate = createAuthenticate(tokenService, authRepository);
  const ministry = [
    authenticate,
    requireRole(UserRole.MINISTRY_ADMIN),
    validateRequest({ params: problemIdParamsSchema }),
  ];
  const controller = createProblemAiController(service);
  const router = Router();

  router.get("/:problemId/ai-analysis", ...ministry, controller.get);
  router.post("/:problemId/ai-analysis", ...ministry, controller.trigger);
  router.post("/:problemId/ai-analysis/retry", ...ministry, controller.retry);

  return router;
}

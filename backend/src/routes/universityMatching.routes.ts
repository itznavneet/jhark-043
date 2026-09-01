import { Router } from "express";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { DevelopmentEmbeddingProvider } from "../ai/developmentEmbedding.provider.js";
import { DevelopmentUniversityRankingProvider } from "../ai/developmentUniversityRanking.provider.js";
import { OpenAiEmbeddingProvider } from "../ai/openAiEmbedding.provider.js";
import { OpenAiUniversityRankingProvider } from "../ai/openAiUniversityRanking.provider.js";
import { createUniversityMatchingController } from "../controllers/universityMatching.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { UniversityMatchingRepository } from "../repositories/university-matching.repository.js";
import {
  UniversityMatchingService,
  type UniversityMatchingServiceContract,
} from "../services/universityMatching.service.js";
import { TokenService } from "../services/token.service.js";
import {
  addRecommendationParamsSchema,
  approveRecommendationsSchema,
  indexKnowledgeQuerySchema,
  matchingProblemParamsSchema,
  matchingRecommendationParamsSchema,
} from "../validators/universityMatching.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface UniversityMatchingRouteDependencies {
  service?: UniversityMatchingServiceContract;
  authRepository?: AuthRepository;
  tokenService?: TokenService;
}

export function createUniversityMatchingRoutes(
  environment: AppEnvironment,
  dependencies: UniversityMatchingRouteDependencies = {},
): Router {
  const authRepository = dependencies.authRepository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const service =
    dependencies.service ??
    new UniversityMatchingService(
      new UniversityMatchingRepository(),
      environment.openAiApiKey
        ? new OpenAiEmbeddingProvider(environment)
        : new DevelopmentEmbeddingProvider(),
      environment.openAiApiKey
        ? new OpenAiUniversityRankingProvider(environment)
        : new DevelopmentUniversityRankingProvider(),
    );
  const authenticate = createAuthenticate(tokenService, authRepository);
  const ministry = [authenticate, requireRole(UserRole.MINISTRY_ADMIN)];
  const controller = createUniversityMatchingController(service);
  const router = Router();

  router.post(
    "/knowledge/index",
    ...ministry,
    validateRequest({ query: indexKnowledgeQuerySchema }),
    controller.index,
  );
  router.post(
    "/problems/:problemId/match",
    ...ministry,
    validateRequest({ params: matchingProblemParamsSchema }),
    controller.match,
  );
  router.post(
    "/problems/:problemId/match/retry",
    ...ministry,
    validateRequest({ params: matchingProblemParamsSchema }),
    controller.retry,
  );
  router.get(
    "/problems/:problemId/recommendations",
    ...ministry,
    validateRequest({ params: matchingProblemParamsSchema }),
    controller.getRecommendations,
  );
  router.get(
    "/problems/:problemId/duplicates",
    ...ministry,
    validateRequest({ params: matchingProblemParamsSchema }),
    controller.duplicates,
  );
  router.post(
    "/problems/:problemId/recommendations/approve",
    ...ministry,
    validateRequest({
      params: matchingProblemParamsSchema,
      body: approveRecommendationsSchema,
    }),
    controller.approve,
  );
  router.post(
    "/problems/:problemId/recommendations/:matchId/remove",
    ...ministry,
    validateRequest({ params: matchingRecommendationParamsSchema }),
    controller.remove,
  );
  router.post(
    "/problems/:problemId/recommendations/add/:universityId",
    ...ministry,
    validateRequest({ params: addRecommendationParamsSchema }),
    controller.add,
  );
  router.get(
    "/problems/:problemId/available-universities",
    ...ministry,
    validateRequest({ params: matchingProblemParamsSchema }),
    controller.available,
  );

  return router;
}

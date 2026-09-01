import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { ProblemAiServiceContract } from "../services/problemAi.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createProblemAiController(service: ProblemAiServiceContract): {
  trigger: RequestHandler;
  retry: RequestHandler;
  get: RequestHandler;
} {
  return {
    trigger: asyncHandler(async (request, response) => {
      const analysis = await service.triggerAnalysis(
        request.params.problemId as string,
      );
      sendSuccess(response, analysis, 200);
    }),
    retry: asyncHandler(async (request, response) => {
      const analysis = await service.retryAnalysis(
        request.params.problemId as string,
      );
      sendSuccess(response, analysis, 200);
    }),
    get: asyncHandler(async (request, response) => {
      const analysis = await service.getAnalysis(
        request.params.problemId as string,
      );
      sendSuccess(response, analysis);
    }),
  };
}

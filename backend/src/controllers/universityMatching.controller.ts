import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { UniversityMatchingServiceContract } from "../services/universityMatching.service.js";
import type { ApproveRecommendationsInput } from "../types/matchingController.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createUniversityMatchingController(
  service: UniversityMatchingServiceContract,
): Record<string, RequestHandler> {
  return {
    index: asyncHandler(async (request, response) => {
      const result = await service.indexKnowledge(
        (request.validated?.query as { universityId?: string } | undefined)
          ?.universityId,
      );
      sendSuccess(response, result);
    }),
    match: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.triggerMatching(request.params.problemId as string),
      );
    }),
    retry: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.retryMatching(request.params.problemId as string),
      );
    }),
    getRecommendations: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getRecommendations(request.params.problemId as string),
      );
    }),
    duplicates: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.findDuplicates(request.params.problemId as string),
      );
    }),
    approve: asyncHandler(async (request, response) => {
      const body = request.body as ApproveRecommendationsInput;
      sendSuccess(
        response,
        await service.approveRecommendations(
          request.params.problemId as string,
          request.auth!.userId,
          body.matchIds,
        ),
      );
    }),
    remove: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.removeRecommendation(
          request.params.problemId as string,
          request.params.matchId as string,
          request.auth!.userId,
        ),
      );
    }),
    add: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.addRecommendation(
          request.params.problemId as string,
          request.params.universityId as string,
        ),
        201,
      );
    }),
    available: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listAvailableUniversities(
          request.params.problemId as string,
        ),
      );
    }),
  };
}

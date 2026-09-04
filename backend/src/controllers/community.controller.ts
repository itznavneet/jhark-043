import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createCommunityController(service: {
  listProblems(userId: string): Promise<unknown>;
  upvote(problemId: string, userId: string): Promise<unknown>;
  downvote(problemId: string, userId: string): Promise<unknown>;
}): Record<string, RequestHandler> {
  return {
    list: asyncHandler(async (request, response) => {
      sendSuccess(response, await service.listProblems(request.auth!.userId));
    }),
    upvote: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.upvote(
          request.params.problemId as string,
          request.auth!.userId,
        ),
        201,
      );
    }),
    downvote: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.downvote(
          request.params.problemId as string,
          request.auth!.userId,
        ),
        201,
      );
    }),
  };
}

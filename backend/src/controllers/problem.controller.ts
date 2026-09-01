import type { RequestHandler } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { ProblemServiceContract } from "../services/problem.service.js";
import type {
  CreateProblemInput,
  ProblemListQuery,
  ProblemTransitionInput,
} from "../types/problem.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createProblemController(service: ProblemServiceContract): {
  create: RequestHandler;
  listMine: RequestHandler;
  listAll: RequestHandler;
  get: RequestHandler;
  timeline: RequestHandler;
  transition: RequestHandler;
} {
  const getForViewer = async (request: Parameters<RequestHandler>[0]) => {
    if (request.auth!.role === UserRole.MINISTRY_ADMIN) {
      return service.getMinistryProblem(request.params.problemId as string);
    }
    return service.getOwnProblem(
      request.auth!.userId,
      request.params.problemId as string,
    );
  };

  return {
    create: asyncHandler(async (request, response) => {
      const problem = await service.createProblem(
        request.auth!.userId,
        request.body as CreateProblemInput,
      );
      sendSuccess(response, problem, 201);
    }),
    listMine: asyncHandler(async (request, response) => {
      const query = (request.validated?.query ?? {}) as ProblemListQuery;
      const problems = await service.listOwnProblems(
        request.auth!.userId,
        query,
      );
      sendSuccess(response, problems);
    }),
    listAll: asyncHandler(async (request, response) => {
      const query = (request.validated?.query ?? {}) as ProblemListQuery;
      const problems = await service.listAllProblems(query);
      sendSuccess(response, problems);
    }),
    get: asyncHandler(async (request, response) => {
      sendSuccess(response, await getForViewer(request));
    }),
    timeline: asyncHandler(async (request, response) => {
      const problem = await getForViewer(request);
      sendSuccess(response, {
        problemId: request.params.problemId,
        timeline: (problem as { timeline: unknown[] }).timeline,
      });
    }),
    transition: asyncHandler(async (request, response) => {
      const problem = await service.transitionProblem(
        request.params.problemId as string,
        request.auth!.userId,
        request.body as ProblemTransitionInput,
      );
      sendSuccess(response, problem);
    }),
  };
}

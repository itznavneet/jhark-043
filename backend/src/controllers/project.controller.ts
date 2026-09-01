import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { ProjectServiceContract } from "../services/project.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createProjectController(
  service: ProjectServiceContract,
): Record<string, RequestHandler> {
  return {
    list: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listProjects(request.auth!.userId, request.auth!.role),
      );
    }),
    get: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getProject(
          request.params.projectId as string,
          request.auth!.userId,
          request.auth!.role,
        ),
      );
    }),
    transition: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.transitionProject(
          request.params.projectId as string,
          request.auth!.userId,
          request.body,
        ),
      );
    }),
    createMilestone: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.createMilestone(
          request.params.projectId as string,
          request.auth!.userId,
          request.body,
        ),
        201,
      );
    }),
    updateMilestone: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.updateMilestone(
          request.params.projectId as string,
          request.params.milestoneId as string,
          request.auth!.userId,
          request.body,
        ),
      );
    }),
    createUpdate: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.createUpdate(
          request.params.projectId as string,
          request.auth!.userId,
          request.body,
        ),
        201,
      );
    }),
    createDocument: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.createDocument(
          request.params.projectId as string,
          request.auth!.userId,
          request.body,
        ),
        201,
      );
    }),
    upsertImpact: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.upsertImpact(
          request.params.projectId as string,
          request.auth!.userId,
          request.body,
        ),
      );
    }),
  };
}

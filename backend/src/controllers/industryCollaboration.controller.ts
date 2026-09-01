import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { IndustryCollaborationServiceContract } from "../services/industryCollaboration.service.js";
import type {
  AcceptIndustryInterestInput,
  ExpressIndustryInterestInput,
  IndustryProposalQueryInput,
} from "../types/industryCollaboration.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createIndustryCollaborationController(
  service: IndustryCollaborationServiceContract,
): Record<string, RequestHandler> {
  return {
    proposals: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listAvailableProposals(
          request.auth!.userId,
          (request.validated?.query ?? {}) as IndustryProposalQueryInput,
        ),
      );
    }),
    proposal: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getAvailableProposal(
          request.auth!.userId,
          request.params.proposalId as string,
        ),
      );
    }),
    expressInterest: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.expressInterest(
          request.auth!.userId,
          request.params.proposalId as string,
          request.body as ExpressIndustryInterestInput,
        ),
        201,
      );
    }),
    interests: asyncHandler(async (request, response) => {
      sendSuccess(response, await service.listInterests(request.auth!.userId));
    }),
    acceptInterest: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.acceptInterest(
          request.auth!.userId,
          request.params.interestId as string,
          request.body as AcceptIndustryInterestInput,
        ),
      );
    }),
    collaborations: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listCollaborations(request.auth!.userId),
      );
    }),
    projects: asyncHandler(async (request, response) => {
      sendSuccess(response, await service.listProjects(request.auth!.userId));
    }),
  };
}

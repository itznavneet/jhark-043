import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { UniversityCollaborationServiceContract } from "../services/universityCollaboration.service.js";
import type {
  ProposalDraftInput,
  RejectAssignmentInput,
  SendInvitationsInput,
  TeamInput,
} from "../types/collaboration.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createUniversityCollaborationController(
  service: UniversityCollaborationServiceContract,
): Record<string, RequestHandler> {
  return {
    sendInvitations: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.sendInvitations(
          request.params.problemId as string,
          request.auth!.userId,
          request.body as SendInvitationsInput,
        ),
        201,
      );
    }),
    ministryInvitations: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listMinistryInvitations(
          request.params.problemId as string,
        ),
      );
    }),
    assignments: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.listUniversityAssignments(request.auth!.userId),
      );
    }),
    assignment: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getUniversityAssignment(
          request.auth!.userId,
          request.params.assignmentId as string,
        ),
      );
    }),
    accept: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.acceptAssignment(
          request.auth!.userId,
          request.params.assignmentId as string,
        ),
      );
    }),
    reject: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.rejectAssignment(
          request.auth!.userId,
          request.params.assignmentId as string,
          request.body as RejectAssignmentInput,
        ),
      );
    }),
    team: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getTeam(
          request.auth!.userId,
          request.params.assignmentId as string,
        ),
      );
    }),
    saveTeam: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.saveTeam(
          request.auth!.userId,
          request.params.assignmentId as string,
          request.body as TeamInput,
        ),
      );
    }),
    proposal: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.getProposal(
          request.auth!.userId,
          request.params.assignmentId as string,
        ),
      );
    }),
    saveProposal: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.saveProposalDraft(
          request.auth!.userId,
          request.params.assignmentId as string,
          request.body as ProposalDraftInput,
        ),
      );
    }),
    submitProposal: asyncHandler(async (request, response) => {
      sendSuccess(
        response,
        await service.submitProposal(
          request.auth!.userId,
          request.params.assignmentId as string,
        ),
      );
    }),
    industryProposals: asyncHandler(async (_request, response) => {
      sendSuccess(response, await service.listSubmittedProposalsForIndustry());
    }),
  };
}

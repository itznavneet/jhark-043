import type { RequestHandler } from "express";
import { RegistrationStatus } from "@prisma/client";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { RegistrationServiceContract } from "../services/registration.service.js";
import type {
  MinistryCreateOrganizationInput,
  RegistrationApplicationInput,
} from "../validators/organization.validator.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createRegistrationController(
  service: RegistrationServiceContract,
): {
  createOrganizationAccount: RequestHandler;
  submitApplication: RequestHandler;
  listApplications: RequestHandler;
  getApplication: RequestHandler;
  approveApplication: RequestHandler;
  rejectApplication: RequestHandler;
} {
  return {
    createOrganizationAccount: asyncHandler(async (request, response) => {
      const result = await service.createOrganizationAccount(
        request.auth!.userId,
        request.body as MinistryCreateOrganizationInput,
      );
      sendSuccess(response, result, 201);
    }),
    submitApplication: asyncHandler(async (request, response) => {
      const result = await service.submitApplication(
        request.auth!.userId,
        request.auth!.role,
        request.body as RegistrationApplicationInput,
      );
      sendSuccess(response, result, 201);
    }),
    listApplications: asyncHandler(async (request, response) => {
      const status = (
        request.validated?.query as { status?: RegistrationStatus } | undefined
      )?.status;
      const result = await service.listApplications(status);
      sendSuccess(response, result);
    }),
    getApplication: asyncHandler(async (request, response) => {
      const result = await service.getApplication(
        request.params.applicationId as string,
      );
      sendSuccess(response, result);
    }),
    approveApplication: asyncHandler(async (request, response) => {
      const result = await service.approveApplication(
        request.params.applicationId as string,
        request.auth!.userId,
      );
      sendSuccess(response, result);
    }),
    rejectApplication: asyncHandler(async (request, response) => {
      const result = await service.rejectApplication(
        request.params.applicationId as string,
        request.auth!.userId,
        request.body.reason,
      );
      sendSuccess(response, result);
    }),
  };
}

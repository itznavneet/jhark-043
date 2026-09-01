import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { OrganizationServiceContract } from "../services/organization.service.js";
import type {
  IndustryDetailsInput,
  UniversityDetailsInput,
} from "../types/organization.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createOrganizationController(
  service: OrganizationServiceContract,
): {
  getUniversityProfile: RequestHandler;
  updateUniversityProfile: RequestHandler;
  getIndustryProfile: RequestHandler;
  updateIndustryProfile: RequestHandler;
} {
  return {
    getUniversityProfile: asyncHandler(async (request, response) => {
      const profile = await service.getUniversityProfile(request.auth!.userId);
      sendSuccess(response, profile);
    }),
    updateUniversityProfile: asyncHandler(async (request, response) => {
      const profile = await service.updateUniversityProfile(
        request.auth!.userId,
        request.body as UniversityDetailsInput,
      );
      sendSuccess(response, profile);
    }),
    getIndustryProfile: asyncHandler(async (request, response) => {
      const profile = await service.getIndustryProfile(request.auth!.userId);
      sendSuccess(response, profile);
    }),
    updateIndustryProfile: asyncHandler(async (request, response) => {
      const profile = await service.updateIndustryProfile(
        request.auth!.userId,
        request.body as IndustryDetailsInput,
      );
      sendSuccess(response, profile);
    }),
  };
}

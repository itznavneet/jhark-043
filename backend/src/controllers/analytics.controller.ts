import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { AnalyticsServiceContract } from "../services/analytics.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createAnalyticsController(
  service: AnalyticsServiceContract,
): RequestHandler {
  return asyncHandler(async (_request, response) => {
    sendSuccess(response, await service.getMinistryAnalytics());
  });
}

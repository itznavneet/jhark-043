import type { RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { HealthServiceContract } from "../services/health.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export function createHealthController(
  healthService: HealthServiceContract,
): RequestHandler {
  return asyncHandler(async (_request, response) => {
    const health = await healthService.getHealth();
    sendSuccess(response, health, health.database === "up" ? 200 : 503);
  });
}

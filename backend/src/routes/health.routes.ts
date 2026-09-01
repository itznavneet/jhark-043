import { Router } from "express";
import { createHealthController } from "../controllers/health.controller.js";
import type { HealthServiceContract } from "../services/health.service.js";

export function createHealthRoutes(
  healthService: HealthServiceContract,
): Router {
  const router = Router();
  router.get("/", createHealthController(healthService));
  return router;
}

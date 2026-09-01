import cors from "cors";
import type { RequestHandler } from "express";
import type { AppEnvironment } from "./environment.js";

export function createCorsMiddleware(
  environment: AppEnvironment,
): RequestHandler {
  return cors({
    origin: environment.frontendUrl,
    credentials: true,
  });
}

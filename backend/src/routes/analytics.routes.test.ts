import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { TokenService } from "../services/token.service.js";
import type { AnalyticsServiceContract } from "../services/analytics.service.js";
import { createAnalyticsRoutes } from "./analytics.routes.js";

const environment: AppEnvironment = {
  nodeEnv: "test",
  port: 4000,
  databaseUrl: "postgresql://test:test@localhost:5432/test",
  jwtSecret: "test-secret-with-at-least-thirty-two-characters",
  frontendUrl: "http://localhost:3000",
  requestBodyLimit: "1mb",
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 30,
  openAiModel: "gpt-4o-mini",
  matchingEmbeddingModel: "text-embedding-3-small",
  matchingRankingModel: "gpt-4o-mini",
};

describe("analytics routes", () => {
  const tokenService = new TokenService(environment);
  const service = {
    getMinistryAnalytics: async () => ({
      generatedAt: "2026-08-31T00:00:00.000Z",
    }),
  } as unknown as AnalyticsServiceContract;
  const authRepository = {
    findActiveUserById: async (userId: string) => ({
      id: userId,
      role: userId.startsWith("ministry")
        ? UserRole.MINISTRY_ADMIN
        : UserRole.SUBMITTER,
    }),
  } as never;

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(
      "/api/analytics",
      createAnalyticsRoutes(environment, {
        service,
        authRepository,
        tokenService,
      }),
    );
    instance.use(createErrorHandler(environment));
    return instance;
  }

  it("allows Ministry administrators to load analytics", async () => {
    const response = await request(app())
      .get("/api/analytics/ministry")
      .set(
        "authorization",
        `Bearer ${tokenService.createAccessToken("ministry-user", UserRole.MINISTRY_ADMIN)}`,
      );

    expect(response.status).toBe(200);
    expect(response.body.data.generatedAt).toBe("2026-08-31T00:00:00.000Z");
  });

  it("blocks non-Ministry roles", async () => {
    const response = await request(app())
      .get("/api/analytics/ministry")
      .set(
        "authorization",
        `Bearer ${tokenService.createAccessToken("submitter-user", UserRole.SUBMITTER)}`,
      );

    expect(response.status).toBe(403);
  });
});

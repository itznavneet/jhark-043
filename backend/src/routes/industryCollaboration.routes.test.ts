import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { TokenService } from "../services/token.service.js";
import type { IndustryCollaborationServiceContract } from "../services/industryCollaboration.service.js";
import { createIndustryCollaborationRoutes } from "./industryCollaboration.routes.js";

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

describe("industry collaboration routes", () => {
  const tokenService = new TokenService(environment);
  const service = {
    listAvailableProposals: async () => [],
  } as unknown as IndustryCollaborationServiceContract;
  const authRepository = {
    findActiveUserById: async (userId: string) => ({
      id: userId,
      role: userId.startsWith("industry")
        ? UserRole.INDUSTRY
        : UserRole.UNIVERSITY,
    }),
  } as never;

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(
      "/api/collaboration/industry",
      createIndustryCollaborationRoutes(environment, {
        service,
        authRepository,
        tokenService,
      }),
    );
    instance.use(createErrorHandler(environment));
    return instance;
  }

  function authorization(role: UserRole) {
    const prefix = role === UserRole.INDUSTRY ? "industry" : "university";
    return `Bearer ${tokenService.createAccessToken(`${prefix}-user`, role)}`;
  }

  it("blocks universities from industry collaboration operations", async () => {
    const response = await request(app())
      .get("/api/collaboration/industry/proposals")
      .set("authorization", authorization(UserRole.UNIVERSITY));

    expect(response.status).toBe(403);
  });

  it("allows industry discovery and validates filters before delegation", async () => {
    const response = await request(app())
      .get(
        "/api/collaboration/industry/proposals?domain=water&minBudget=1000&supportType=FUNDING",
      )
      .set("authorization", authorization(UserRole.INDUSTRY));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it("rejects malformed support requests at the API boundary", async () => {
    const response = await request(app())
      .post(
        "/api/collaboration/industry/proposals/00000000-0000-4000-8000-000000000001/interests",
      )
      .set("authorization", authorization(UserRole.INDUSTRY))
      .send({ supportType: "NOT_A_SUPPORT_TYPE" });

    expect(response.status).toBe(400);
  });
});

import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { TokenService } from "../services/token.service.js";
import type { ProjectServiceContract } from "../services/project.service.js";
import { createProjectRoutes } from "./project.routes.js";

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

describe("project routes", () => {
  const tokenService = new TokenService(environment);
  const service = {
    listProjects: async () => [],
    getProject: async () => ({ id: "project" }),
    transitionProject: async () => ({ id: "project" }),
  } as unknown as ProjectServiceContract;
  const authRepository = {
    findActiveUserById: async (userId: string) => ({
      id: userId,
      role: userId.startsWith("university")
        ? UserRole.UNIVERSITY
        : userId.startsWith("ministry")
          ? UserRole.MINISTRY_ADMIN
          : userId.startsWith("industry")
            ? UserRole.INDUSTRY
            : UserRole.SUBMITTER,
    }),
  } as never;

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(
      "/api/projects",
      createProjectRoutes(environment, {
        service,
        authRepository,
        tokenService,
      }),
    );
    instance.use(createErrorHandler(environment));
    return instance;
  }

  function authorization(userId: string, role: UserRole) {
    return `Bearer ${tokenService.createAccessToken(userId, role)}`;
  }

  it("allows project visibility to every supported role", async () => {
    for (const [userId, role] of [
      ["ministry-user", UserRole.MINISTRY_ADMIN],
      ["submitter-user", UserRole.SUBMITTER],
      ["university-user", UserRole.UNIVERSITY],
      ["industry-user", UserRole.INDUSTRY],
    ] as const) {
      const response = await request(app())
        .get("/api/projects")
        .set("authorization", authorization(userId, role));
      expect(response.status).toBe(200);
    }
  });

  it("restricts all project mutations to universities", async () => {
    const response = await request(app())
      .post("/api/projects/00000000-0000-4000-8000-000000000001/status")
      .set("authorization", authorization("industry-user", UserRole.INDUSTRY))
      .send({ status: "FIELD_PILOT" });
    expect(response.status).toBe(403);
  });

  it("validates transitions before calling the service", async () => {
    const response = await request(app())
      .post("/api/projects/00000000-0000-4000-8000-000000000001/status")
      .set(
        "authorization",
        authorization("university-user", UserRole.UNIVERSITY),
      )
      .send({ status: "NOT_A_PROJECT_STATUS" });
    expect(response.status).toBe(400);
  });
});

import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createUniversityCollaborationRoutes } from "./universityCollaboration.routes.js";
import { TokenService } from "../services/token.service.js";
import type { UniversityCollaborationServiceContract } from "../services/universityCollaboration.service.js";

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

describe("university collaboration routes", () => {
  const tokenService = new TokenService(environment);
  const service = {
    getUniversityAssignment: async () => ({ id: "assignment" }),
  } as unknown as UniversityCollaborationServiceContract;
  const authRepository = {
    findActiveUserById: async (userId: string) => ({
      id: userId,
      role: userId.startsWith("ministry")
        ? UserRole.MINISTRY_ADMIN
        : userId.startsWith("industry")
          ? UserRole.INDUSTRY
          : UserRole.UNIVERSITY,
    }),
  } as never;

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(
      "/api/collaboration",
      createUniversityCollaborationRoutes(environment, {
        service,
        authRepository,
        tokenService,
      }),
    );
    return instance;
  }

  function authorization(role: UserRole) {
    const prefix =
      role === UserRole.MINISTRY_ADMIN
        ? "ministry"
        : role === UserRole.INDUSTRY
          ? "industry"
          : "university";
    return `Bearer ${tokenService.createAccessToken(`${prefix}-user`, role)}`;
  }

  it("blocks non-Ministry users from sending invitations", async () => {
    const response = await request(app())
      .post(
        "/api/collaboration/problems/00000000-0000-4000-8000-000000000001/invitations",
      )
      .set("authorization", authorization(UserRole.UNIVERSITY))
      .send({ matchIds: ["00000000-0000-4000-8000-000000000002"] });

    expect(response.status).toBe(403);
  });

  it("blocks Ministry users from university-owned assignment routes", async () => {
    const response = await request(app())
      .get(
        "/api/collaboration/university/assignments/00000000-0000-4000-8000-000000000002",
      )
      .set("authorization", authorization(UserRole.MINISTRY_ADMIN));

    expect(response.status).toBe(403);
  });

  it("allows the university role and blocks other organization roles from industry discovery", async () => {
    const universityResponse = await request(app())
      .get(
        "/api/collaboration/university/assignments/00000000-0000-4000-8000-000000000002",
      )
      .set("authorization", authorization(UserRole.UNIVERSITY));
    const industryResponse = await request(app())
      .get("/api/collaboration/proposals")
      .set("authorization", authorization(UserRole.UNIVERSITY));

    expect(universityResponse.status).toBe(200);
    expect(universityResponse.body.data).toEqual({ id: "assignment" });
    expect(industryResponse.status).toBe(403);
  });

  it("blocks industry users from editing university proposals", async () => {
    const response = await request(app())
      .put(
        "/api/collaboration/university/assignments/00000000-0000-4000-8000-000000000002/proposal",
      )
      .set("authorization", authorization(UserRole.INDUSTRY))
      .send({});

    expect(response.status).toBe(403);
  });
});

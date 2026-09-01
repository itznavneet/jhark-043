import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { requestIdMiddleware } from "../middleware/requestId.js";
import type { AppEnvironment } from "../config/environment.js";
import { requireRole } from "./requireRole.js";

const testEnvironment: AppEnvironment = {
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

function createRoleTestApp(role: UserRole) {
  const app = express();
  app.use(requestIdMiddleware);
  app.use((_request, _response, next) => {
    _request.auth = { userId: "test-user", role };
    next();
  });
  app.get(
    "/ministry-only",
    requireRole(UserRole.MINISTRY_ADMIN),
    (_request, response) => response.json({ allowed: true }),
  );
  app.use(createErrorHandler(testEnvironment));
  return app;
}

describe("requireRole", () => {
  it("allows the required role", async () => {
    const response = await request(
      createRoleTestApp(UserRole.MINISTRY_ADMIN),
    ).get("/ministry-only");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ allowed: true });
  });

  it("rejects a different role", async () => {
    const response = await request(createRoleTestApp(UserRole.SUBMITTER)).get(
      "/ministry-only",
    );

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

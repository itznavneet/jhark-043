import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import type { AppEnvironment } from "./config/environment.js";

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

describe("backend foundation", () => {
  it("returns the health response using the service contract", async () => {
    const app = createApp({
      environment: testEnvironment,
      healthService: {
        getHealth: async () => ({
          status: "ok",
          environment: "test",
          database: "up",
          checkedAt: "2026-01-01T00:00:00.000Z",
        }),
      },
    });

    const response = await request(app)
      .get("/api/health")
      .set("x-request-id", "test-request");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
        environment: "test",
        database: "up",
        checkedAt: "2026-01-01T00:00:00.000Z",
      },
      requestId: "test-request",
    });
    expect(response.headers["x-request-id"]).toBe("test-request");
  });

  it("returns a safe API 404 envelope", async () => {
    const app = createApp({ environment: testEnvironment });
    const response = await request(app).get("/api/not-a-real-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.error.message).toContain("Route not found");
    expect(response.body.error.stack).toBeUndefined();
  });

  it("returns a client error for malformed JSON", async () => {
    const app = createApp({ environment: testEnvironment });
    const response = await request(app)
      .post("/api/auth/login")
      .set("content-type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
    expect(response.body.error.stack).toBeUndefined();
  });
});

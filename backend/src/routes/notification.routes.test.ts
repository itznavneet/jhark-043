import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import type { AppEnvironment } from "../config/environment.js";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { TokenService } from "../services/token.service.js";
import type { NotificationServiceContract } from "../services/notification.service.js";
import { createNotificationRoutes } from "./notification.routes.js";

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

describe("notification routes", () => {
  const tokenService = new TokenService(environment);
  const service = {
    list: async () => [],
    unreadCount: async () => 2,
    markRead: async () => ({ id: "notification" }),
    markAllRead: async () => ({ count: 2 }),
  } as unknown as NotificationServiceContract;
  const authRepository = {
    findActiveUserById: async (userId: string) => ({
      id: userId,
      role: UserRole.SUBMITTER,
    }),
  } as never;

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(
      "/api/notifications",
      createNotificationRoutes(environment, {
        service,
        authRepository,
        tokenService,
      }),
    );
    instance.use(createErrorHandler(environment));
    return instance;
  }

  function authorization() {
    return `Bearer ${tokenService.createAccessToken("submitter-user", UserRole.SUBMITTER)}`;
  }

  it("lists notifications and exposes the unread count", async () => {
    const response = await request(app())
      .get("/api/notifications?unreadOnly=true")
      .set("authorization", authorization());
    expect(response.status).toBe(200);

    const count = await request(app())
      .get("/api/notifications/unread-count")
      .set("authorization", authorization());
    expect(count.status).toBe(200);
    expect(count.body.data.unreadCount).toBe(2);
  });

  it("requires authentication for notification access", async () => {
    const response = await request(app()).get("/api/notifications");
    expect(response.status).toBe(401);
  });

  it("validates notification identifiers before marking read", async () => {
    const response = await request(app())
      .patch("/api/notifications/not-a-uuid/read")
      .set("authorization", authorization());
    expect(response.status).toBe(400);
  });
});

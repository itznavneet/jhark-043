import type { Request, RequestHandler } from "express";
import type { AppEnvironment } from "../config/environment.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import type { AuthServiceContract } from "../services/auth.service.js";
import type { LoginInput, UpdateProfileInput } from "../types/auth.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  clearRefreshCookie,
  refreshCookieName,
  setRefreshCookie,
} from "../utils/authCookie.js";

export function createAuthController(
  authService: AuthServiceContract,
  environment: AppEnvironment,
): {
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  me: RequestHandler;
  changePassword: RequestHandler;
  updateProfile: RequestHandler;
  registerSubmitter: RequestHandler;
} {
  return {
    login: asyncHandler(async (request, response) => {
      const result = await authService.login(
        request.body as LoginInput,
        getRequestMetadata(request),
      );
      setRefreshCookie(
        response,
        result.refreshToken,
        result.refreshTokenMaxAgeMs,
        environment,
      );
      sendSuccess(response, toClientAuthResponse(result));
    }),
    registerSubmitter: asyncHandler(async (request, response) => {
      const user = await authService.registerSubmitter(request.body);
      sendSuccess(response, { user }, 201);
    }),
    refresh: asyncHandler(async (request, response) => {
      const refreshToken = request.cookies?.[refreshCookieName];
      const result = await authService.refresh(
        refreshToken ?? "",
        getRequestMetadata(request),
      );
      setRefreshCookie(
        response,
        result.refreshToken,
        result.refreshTokenMaxAgeMs,
        environment,
      );
      sendSuccess(response, toClientAuthResponse(result));
    }),
    logout: asyncHandler(async (request, response) => {
      await authService.logout(request.cookies?.[refreshCookieName]);
      clearRefreshCookie(response, environment);
      sendSuccess(response, { loggedOut: true });
    }),
    me: asyncHandler(async (request, response) => {
      const user = await authService.getCurrentUser(request.auth!.userId);
      sendSuccess(response, { user });
    }),
    changePassword: asyncHandler(async (request, response) => {
      const user = await authService.changePassword(
        request.auth!.userId,
        request.body.currentPassword,
        request.body.newPassword,
      );
      sendSuccess(response, { user });
    }),
    updateProfile: asyncHandler(async (request, response) => {
      const user = await authService.updateProfile(
        request.auth!.userId,
        request.body as UpdateProfileInput,
      );
      sendSuccess(response, { user });
    }),
  };
}

function getRequestMetadata(request: Request) {
  return {
    userAgent: request.get("user-agent") ?? null,
    ipAddress: request.ip ?? null,
  };
}

function toClientAuthResponse(
  result: Awaited<ReturnType<AuthServiceContract["login"]>>,
) {
  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    expiresIn: result.expiresIn,
    user: result.user,
  };
}

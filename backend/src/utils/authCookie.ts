import type { Response } from "express";
import type { AppEnvironment } from "../config/environment.js";

export const refreshCookieName = "refreshToken";

function getCookieOptions(environment: AppEnvironment) {
  return {
    httpOnly: true,
    secure: environment.nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/api/auth",
  };
}

export function setRefreshCookie(
  response: Response,
  token: string,
  maxAge: number,
  environment: AppEnvironment,
): void {
  response.cookie(refreshCookieName, token, {
    ...getCookieOptions(environment),
    maxAge,
  });
}

export function clearRefreshCookie(
  response: Response,
  environment: AppEnvironment,
): void {
  response.clearCookie(refreshCookieName, getCookieOptions(environment));
}

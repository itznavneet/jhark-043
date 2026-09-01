import { createHash, randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { AppEnvironment } from "../config/environment.js";
import type { AuthContext } from "../types/auth.js";
import { AppError } from "../utils/appError.js";

const userRoles = new Set<UserRole>([
  "MINISTRY_ADMIN",
  "SUBMITTER",
  "UNIVERSITY",
  "INDUSTRY",
]);

export interface RefreshTokenMaterial {
  token: string;
  tokenHash: string;
}

export class TokenService {
  constructor(private readonly environment: AppEnvironment) {}

  createAccessToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { sub: userId, role, type: "access" },
      this.environment.jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: this.environment.accessTokenTtlSeconds,
      },
    );
  }

  verifyAccessToken(token: string): AuthContext {
    try {
      const payload = jwt.verify(token, this.environment.jwtSecret, {
        algorithms: ["HS256"],
      });

      if (!isAccessTokenPayload(payload) || !userRoles.has(payload.role)) {
        throw new Error("Invalid access token claims");
      }

      return {
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      throw new AppError(
        "Invalid or expired access token",
        401,
        "INVALID_ACCESS_TOKEN",
      );
    }
  }

  createRefreshToken(): RefreshTokenMaterial {
    const token = randomBytes(48).toString("base64url");
    return { token, tokenHash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

function isAccessTokenPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & {
  sub: string;
  role: UserRole;
  type: "access";
} {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.role === "string" &&
    payload.type === "access"
  );
}

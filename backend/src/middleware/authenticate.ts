import type { RequestHandler } from "express";
import type { AuthRepository } from "../repositories/auth.repository.js";
import { TokenService } from "../services/token.service.js";
import { AppError } from "../utils/appError.js";

export function createAuthenticate(
  tokenService: TokenService,
  repository: Pick<AuthRepository, "findActiveUserById">,
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const authorization = request.header("authorization");
      const [scheme, token] = authorization?.split(" ") ?? [];

      if (scheme?.toLowerCase() !== "bearer" || !token) {
        throw new AppError(
          "Authentication is required",
          401,
          "AUTHENTICATION_REQUIRED",
        );
      }

      const tokenContext = tokenService.verifyAccessToken(token);
      const user = await repository.findActiveUserById(tokenContext.userId);

      if (!user || user.role !== tokenContext.role) {
        throw new AppError(
          "Authentication is required",
          401,
          "AUTHENTICATION_REQUIRED",
        );
      }

      request.auth = tokenContext;
      next();
    } catch (error) {
      next(error);
    }
  };
}

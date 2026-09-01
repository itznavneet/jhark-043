import type { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { AppError } from "../utils/appError.js";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError(
          "Authentication is required",
          401,
          "AUTHENTICATION_REQUIRED",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(
        new AppError(
          "You do not have permission to access this resource",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}

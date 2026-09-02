import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { z } from "zod";
import type { AppEnvironment } from "../config/environment.js";
import type { ApiErrorResponse } from "../types/api.js";
import { AppError } from "../utils/appError.js";

export function createErrorHandler(
  environment: AppEnvironment,
): ErrorRequestHandler {
  return (error, request, response, _next) => {
    const normalized = normalizeError(error);
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details === undefined
          ? {}
          : { details: normalized.details }),
      },
      requestId: request.requestId,
    };

    if (environment.nodeEnv !== "test" && normalized.statusCode >= 500) {
      console.error(error);
    }

    response.status(normalized.statusCode).json(body);
  };
}

function normalizeError(error: unknown): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        statusCode: 409,
        code: "DUPLICATE_RESOURCE",
        message: "A resource with the same unique value already exists",
      };
    }

    if (error.code === "P2025") {
      return {
        statusCode: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "The requested resource was not found",
      };
    }

    return {
      statusCode: 500,
      code: "DATABASE_ERROR",
      message: "A database error occurred",
    };
  }

  if (isRequestBodyError(error)) {
    return error.type === "entity.too.large"
      ? {
          statusCode: 413,
          code: "REQUEST_TOO_LARGE",
          message: "Request body is too large",
        }
      : {
          statusCode: 400,
          code: "INVALID_JSON",
          message: "Request body contains invalid JSON",
        };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  };
}

function isRequestBodyError(
  error: unknown,
): error is { type: string; status?: number; statusCode?: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof error.type === "string" &&
    ["entity.parse.failed", "entity.too.large"].includes(error.type)
  );
}

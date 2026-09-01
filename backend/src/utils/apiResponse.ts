import type { Response } from "express";
import type { ApiSuccessResponse } from "../types/api.js";

export function sendSuccess<T>(
  response: Response,
  data: T,
  statusCode = 200,
): Response<ApiSuccessResponse<T>> {
  return response.status(statusCode).json({
    success: true,
    data,
    requestId: response.req.requestId,
  });
}

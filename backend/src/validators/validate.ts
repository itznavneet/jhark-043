import type { RequestHandler } from "express";

interface ParsableSchema {
  parse(input: unknown): unknown;
}

export interface RequestSchemas {
  body?: ParsableSchema;
  params?: ParsableSchema;
  query?: ParsableSchema;
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    const validated: NonNullable<typeof request.validated> = {};
    if (schemas.body) {
      validated.body = schemas.body.parse(request.body);
      request.body = validated.body;
    }
    if (schemas.params) {
      validated.params = schemas.params.parse(request.params);
      request.params = validated.params as typeof request.params;
    }
    if (schemas.query) {
      validated.query = schemas.query.parse(request.query);
    }
    request.validated = validated;
    next();
  };
}

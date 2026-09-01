import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createCorsMiddleware } from "./config/cors.js";
import { loadEnvironment, type AppEnvironment } from "./config/environment.js";
import { createErrorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { createApiRoutes } from "./routes/index.js";
import {
  HealthService,
  type HealthServiceContract,
} from "./services/health.service.js";

export interface AppDependencies {
  environment?: AppEnvironment;
  healthService?: HealthServiceContract;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const environment = dependencies.environment ?? loadEnvironment();
  const healthService =
    dependencies.healthService ?? new HealthService(environment);
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(createCorsMiddleware(environment));
  app.use(express.json({ limit: environment.requestBodyLimit }));
  app.use(
    express.urlencoded({
      extended: false,
      limit: environment.requestBodyLimit,
    }),
  );
  app.use(cookieParser());

  app.use("/api", createApiRoutes(environment, healthService));
  app.use(notFoundHandler);
  app.use(createErrorHandler(environment));

  return app;
}

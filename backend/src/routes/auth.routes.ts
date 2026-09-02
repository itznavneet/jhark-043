import { Router } from "express";
import type { AppEnvironment } from "../config/environment.js";
import { createAuthController } from "../controllers/auth.controller.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import {
  AuthService,
  type AuthServiceContract,
} from "../services/auth.service.js";
import { TokenService } from "../services/token.service.js";
import {
  changePasswordSchema,
  loginSchema,
  submitterRegistrationSchema,
} from "../validators/auth.validator.js";
import { validateRequest } from "../validators/validate.js";

export interface AuthRouteDependencies {
  repository?: AuthRepository;
  tokenService?: TokenService;
  authService?: AuthServiceContract;
}

export function createAuthRoutes(
  environment: AppEnvironment,
  dependencies: AuthRouteDependencies = {},
): Router {
  const repository = dependencies.repository ?? new AuthRepository();
  const tokenService =
    dependencies.tokenService ?? new TokenService(environment);
  const authService =
    dependencies.authService ??
    new AuthService(environment, repository, tokenService);
  const controller = createAuthController(authService, environment);
  const authenticate = createAuthenticate(tokenService, repository);
  const router = Router();

  router.post(
    "/login",
    validateRequest({ body: loginSchema }),
    controller.login,
  );
  router.post(
    "/register/submitter",
    validateRequest({ body: submitterRegistrationSchema }),
    controller.registerSubmitter,
  );
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.get("/me", authenticate, controller.me);
  router.post(
    "/change-password",
    authenticate,
    validateRequest({ body: changePasswordSchema }),
    controller.changePassword,
  );

  return router;
}

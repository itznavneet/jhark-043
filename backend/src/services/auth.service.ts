import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { AppEnvironment } from "../config/environment.js";
import {
  AuthRepository,
  type AuthUserRecord,
  type RefreshSessionRecord,
} from "../repositories/auth.repository.js";
import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RequestMetadata,
  SubmitterRegistrationInput,
} from "../types/auth.js";
import { AppError } from "../utils/appError.js";
import { TokenService, type RefreshTokenMaterial } from "./token.service.js";

const invalidCredentialsError = () =>
  new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

export interface InternalAuthResult extends AuthResponse {
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

export interface AuthServiceContract {
  login(
    input: LoginInput,
    metadata: RequestMetadata,
  ): Promise<InternalAuthResult>;
  registerSubmitter(input: SubmitterRegistrationInput): Promise<PublicUser>;
  refresh(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<InternalAuthResult>;
  logout(refreshToken: string | undefined): Promise<void>;
  getCurrentUser(userId: string): Promise<PublicUser>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<PublicUser>;
}

export class AuthService implements AuthServiceContract {
  constructor(
    private readonly environment: AppEnvironment,
    private readonly repository: AuthRepository = new AuthRepository(),
    private readonly tokenService: TokenService = new TokenService(environment),
  ) {}

  async login(
    input: LoginInput,
    metadata: RequestMetadata,
  ): Promise<InternalAuthResult> {
    const user = await this.repository.findUserByEmail(
      input.email.trim().toLowerCase(),
    );

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(input.password, user.passwordHash))
    ) {
      throw invalidCredentialsError();
    }

    if (user.role !== input.accountType) {
      throw new AppError(
        `This account is registered as a ${roleLabel(user.role)} account. Please select ${roleLabel(user.role)}.`,
        401,
        "ACCOUNT_TYPE_MISMATCH",
      );
    }

    return this.createAuthResult(user, metadata);
  }

  async registerSubmitter(
    input: SubmitterRegistrationInput,
  ): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    if (await this.repository.findUserByEmail(email)) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "EMAIL_ALREADY_REGISTERED",
      );
    }

    try {
      const user = await this.repository.createSubmitter({
        id: randomUUID(),
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        displayName: input.displayName,
        submitterType: input.submitterType,
        organizationName: input.organizationName,
        description: input.description,
      });
      return toPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "An account with this email already exists",
          409,
          "EMAIL_ALREADY_REGISTERED",
        );
      }
      throw error;
    }
  }

  async refresh(
    refreshToken: string,
    metadata: RequestMetadata,
  ): Promise<InternalAuthResult> {
    const session = await this.repository.findRefreshSessionByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (!isUsableRefreshSession(session)) {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    }

    const nextRefreshToken = this.tokenService.createRefreshToken();
    const rotated = await this.repository.rotateRefreshSession({
      sessionId: session.id,
      userId: session.user.id,
      tokenHash: nextRefreshToken.tokenHash,
      expiresAt: this.getRefreshExpiry(),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    if (!rotated) {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    }

    return this.createAuthResultFromMaterial(session.user, nextRefreshToken);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const session = await this.repository.findRefreshSessionByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );

    if (session) {
      await this.repository.revokeRefreshSession(session.id);
    }
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.repository.findActiveUserById(userId);

    if (!user) {
      throw new AppError(
        "Authenticated user was not found",
        401,
        "AUTHENTICATED_USER_NOT_FOUND",
      );
    }

    return toPublicUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<PublicUser> {
    const user = await this.repository.findActiveUserById(userId);

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw invalidCredentialsError();
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        "New password must be different from the current password",
        400,
        "PASSWORD_UNCHANGED",
      );
    }

    const updated = await this.repository.updatePassword(
      userId,
      await bcrypt.hash(newPassword, 12),
    );
    await this.repository.revokeRefreshSessionsForUser(userId);
    return toPublicUser(updated);
  }

  private async createAuthResult(
    user: AuthUserRecord,
    metadata: RequestMetadata,
  ): Promise<InternalAuthResult> {
    const refreshToken = this.tokenService.createRefreshToken();
    await this.repository.createRefreshSession({
      userId: user.id,
      tokenHash: refreshToken.tokenHash,
      expiresAt: this.getRefreshExpiry(),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });
    return this.createAuthResultFromMaterial(user, refreshToken);
  }

  private createAuthResultFromMaterial(
    user: AuthUserRecord,
    refreshToken: RefreshTokenMaterial,
  ): InternalAuthResult {
    return {
      accessToken: this.tokenService.createAccessToken(user.id, user.role),
      tokenType: "Bearer",
      expiresIn: this.environment.accessTokenTtlSeconds,
      user: toPublicUser(user),
      refreshToken: refreshToken.token,
      refreshTokenMaxAgeMs:
        this.environment.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    };
  }

  private getRefreshExpiry(): Date {
    return new Date(
      Date.now() + this.environment.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );
  }
}

function isUsableRefreshSession(
  session: RefreshSessionRecord | null,
): session is RefreshSessionRecord & { revokedAt: null } {
  return Boolean(
    session &&
    !session.revokedAt &&
    session.expiresAt.getTime() > Date.now() &&
    session.user.isActive,
  );
}

function roleLabel(role: AuthUserRecord["role"]): string {
  return {
    MINISTRY_ADMIN: "Ministry",
    SUBMITTER: "Citizen / Submitter",
    UNIVERSITY: "University",
    INDUSTRY: "Industry",
  }[role];
}

export function toPublicUser(user: AuthUserRecord): PublicUser {
  if (user.submitterProfile) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      mustChangePassword: user.mustChangePassword,
      mustCompleteProfile: user.mustCompleteProfile,
      profile: {
        type: user.submitterProfile.type,
        name: user.submitterProfile.displayName,
        ...(user.submitterProfile.organizationName
          ? { organizationName: user.submitterProfile.organizationName }
          : {}),
      },
    };
  }

  if (user.university) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      mustChangePassword: user.mustChangePassword,
      mustCompleteProfile: user.mustCompleteProfile,
      profile: {
        organizationId: user.university.id,
        organizationName: user.university.name,
      },
    };
  }

  if (user.industry) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      mustChangePassword: user.mustChangePassword,
      mustCompleteProfile: user.mustCompleteProfile,
      profile: {
        organizationId: user.industry.id,
        organizationName: user.industry.name,
      },
    };
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    mustChangePassword: user.mustChangePassword,
    mustCompleteProfile: user.mustCompleteProfile,
    profile: null,
  };
}

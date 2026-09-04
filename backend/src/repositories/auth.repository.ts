import { Prisma, type PrismaClient, type SubmitterType } from "@prisma/client";
import { database } from "../config/database.js";

export const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  displayName: true,
  isActive: true,
  mustChangePassword: true,
  mustCompleteProfile: true,
  submitterProfile: {
    select: {
      type: true,
      displayName: true,
      organizationName: true,
    },
  },
  university: {
    select: {
      id: true,
      name: true,
    },
  },
  industry: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

const refreshSessionInclude = {
  user: {
    select: authUserSelect,
  },
} as const;

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;
export type RefreshSessionRecord = Prisma.RefreshSessionGetPayload<{
  include: typeof refreshSessionInclude;
}>;

export interface CreateRefreshSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface RotateRefreshSessionInput extends CreateRefreshSessionInput {
  sessionId: string;
}

export interface CreateSubmitterInput {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  submitterType: SubmitterType;
  organizationName?: string;
  description?: string;
}

export class AuthRepository {
  constructor(private readonly client: PrismaClient = database) {}

  findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.client.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  }

  createSubmitter(input: CreateSubmitterInput): Promise<AuthUserRecord> {
    return this.client.user.create({
      data: {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "SUBMITTER",
        displayName: input.displayName,
        submitterProfile: {
          create: {
            type: input.submitterType,
            displayName: input.displayName,
            organizationName: input.organizationName ?? null,
            description: input.description ?? null,
          },
        },
      },
      select: authUserSelect,
    });
  }

  findActiveUserById(userId: string): Promise<AuthUserRecord | null> {
    return this.client.user.findFirst({
      where: { id: userId, isActive: true },
      select: authUserSelect,
    });
  }

  async createRefreshSession(input: CreateRefreshSessionInput): Promise<void> {
    await this.client.refreshSession.create({ data: input });
  }

  findRefreshSessionByHash(
    tokenHash: string,
  ): Promise<RefreshSessionRecord | null> {
    return this.client.refreshSession.findUnique({
      where: { tokenHash },
      include: refreshSessionInclude,
    });
  }

  async revokeRefreshSession(sessionId: string): Promise<void> {
    await this.client.refreshSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<AuthUserRecord> {
    return this.client.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
      select: authUserSelect,
    });
  }

  async updateDisplayName(
    userId: string,
    displayName: string,
  ): Promise<AuthUserRecord> {
    return this.client.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: { displayName } });
      await transaction.submitterProfile.updateMany({ where: { userId }, data: { displayName } });
      return transaction.user.findUniqueOrThrow({ where: { id: userId }, select: authUserSelect });
    });
  }

  async revokeRefreshSessionsForUser(userId: string): Promise<void> {
    await this.client.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotateRefreshSession(
    input: RotateRefreshSessionInput,
  ): Promise<boolean> {
    return this.client.$transaction(async (transaction) => {
      const consumed = await transaction.refreshSession.updateMany({
        where: {
          id: input.sessionId,
          userId: input.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (consumed.count !== 1) {
        return false;
      }

      await transaction.refreshSession.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
      });

      return true;
    });
  }
}

import type { SubmitterType, UserRole } from "@prisma/client";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  mustChangePassword: boolean;
  mustCompleteProfile: boolean;
  profile: {
    type?: SubmitterType;
    organizationId?: string;
    organizationName?: string;
    name?: string;
  } | null;
}

export interface LoginInput {
  email: string;
  password: string;
  accountType: UserRole;
}

export interface SubmitterRegistrationInput {
  email: string;
  password: string;
  displayName: string;
  submitterType: SubmitterType;
  organizationName?: string;
  description?: string;
}

export interface UpdateProfileInput {
  displayName: string;
}

export interface RequestMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
}

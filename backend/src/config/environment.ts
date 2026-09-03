import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  REQUEST_BODY_LIMIT: z.string().min(1).default("1mb"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  MATCHING_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  MATCHING_RANKING_MODEL: z.string().min(1).default("gpt-4o-mini"),
  UPVOTE_THRESHOLD: z.coerce.number().int().positive().default(3),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
});

export type AppEnvironment = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  frontendUrl: string;
  requestBodyLimit: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  openAiApiKey?: string;
  openAiModel: string;
  matchingEmbeddingModel: string;
  matchingRankingModel: string;
  upvoteThreshold?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  emailFrom?: string;
};

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): AppEnvironment {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map(
        (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
      )
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    databaseUrl: result.data.DATABASE_URL,
    jwtSecret: result.data.JWT_SECRET,
    frontendUrl: result.data.FRONTEND_URL,
    requestBodyLimit: result.data.REQUEST_BODY_LIMIT,
    accessTokenTtlSeconds: result.data.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlDays: result.data.REFRESH_TOKEN_TTL_DAYS,
    openAiApiKey: usableSecret(result.data.OPENAI_API_KEY),
    openAiModel: result.data.OPENAI_MODEL,
    matchingEmbeddingModel: result.data.MATCHING_EMBEDDING_MODEL,
    matchingRankingModel: result.data.MATCHING_RANKING_MODEL,
    upvoteThreshold: result.data.UPVOTE_THRESHOLD,
    smtpHost: result.data.SMTP_HOST,
    smtpPort: result.data.SMTP_PORT,
    smtpUser: result.data.SMTP_USER,
    smtpPassword: result.data.SMTP_PASSWORD,
    emailFrom: result.data.EMAIL_FROM,
  };
}

function usableSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.startsWith("replace-with-") ||
    ["none", "disabled", "not-configured"].includes(normalized.toLowerCase())
  ) {
    return undefined;
  }
  return normalized;
}

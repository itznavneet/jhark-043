import type { AppEnvironment } from "../config/environment.js";
import {
  HealthRepository,
  type HealthRepositoryContract,
} from "../repositories/health.repository.js";

export interface HealthPayload {
  status: "ok" | "degraded";
  environment: AppEnvironment["nodeEnv"];
  database: "up" | "down";
  checkedAt: string;
}

export interface HealthServiceContract {
  getHealth(): Promise<HealthPayload>;
}

export class HealthService implements HealthServiceContract {
  constructor(
    private readonly environment: AppEnvironment,
    private readonly repository: HealthRepositoryContract = new HealthRepository(),
  ) {}

  async getHealth(): Promise<HealthPayload> {
    let databaseStatus: HealthPayload["database"] = "up";

    try {
      await this.repository.checkConnectivity();
    } catch {
      databaseStatus = "down";
    }

    return {
      status: databaseStatus === "up" ? "ok" : "degraded",
      environment: this.environment.nodeEnv,
      database: databaseStatus,
      checkedAt: new Date().toISOString(),
    };
  }
}

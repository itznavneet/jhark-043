import type { PrismaClient } from "@prisma/client";
import { database } from "../config/database.js";

export interface HealthRepositoryContract {
  checkConnectivity(): Promise<void>;
}

export class HealthRepository implements HealthRepositoryContract {
  constructor(private readonly client: PrismaClient = database) {}

  async checkConnectivity(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}

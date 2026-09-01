import { PrismaClient } from "@prisma/client";

export const database = new PrismaClient();

export async function disconnectDatabase(): Promise<void> {
  await database.$disconnect();
}

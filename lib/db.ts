import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ENV } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = ENV.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ENV.IS_PRODUCTION ? ["error"] : ["error", "warn"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (!ENV.IS_PRODUCTION) {
  globalForPrisma.prisma = db;
}

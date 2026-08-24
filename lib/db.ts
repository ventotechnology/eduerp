import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Pool } from "pg";
import { ENV } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = ENV.DATABASE_URL;

  let adapter: any;
  if (connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://")) {
    const pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  } else {
    const dbPath = connectionString.replace("file:", "");
    adapter = new PrismaBetterSqlite3({ url: dbPath });
  }

  return new PrismaClient({
    adapter,
    log: ENV.IS_PRODUCTION ? ["error"] : ["error", "warn"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (!ENV.IS_PRODUCTION) {
  globalForPrisma.prisma = db;
}

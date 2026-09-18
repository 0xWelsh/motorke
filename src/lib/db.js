// src/lib/db.js
// Singleton Prisma client — always reuse `globalThis.prisma` so Vercel
// serverless does not instantiate dozens of clients per cold start (P2024).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
    // Aggressively close idle connections to avoid pooler exhaustion
    __internal: {
      engine: {
        // Connection timeout: 10s (default 5s is too aggressive for pooler)
        connectTimeout: 10_000,
        // Query timeout: 15s (catches stuck queries before pooler kills them)
        queryTimeout: 15_000,
      },
    },
  });
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = db;

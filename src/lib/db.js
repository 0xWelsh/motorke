// src/lib/db.js
// Singleton Prisma client — always reuse `globalThis.prisma` so serverless
// does not instantiate dozens of clients per cold start (P2024).

import { PrismaClient } from "@prisma/client";
import { withQueryMonitoring } from "@/lib/query-monitor";

const globalForPrisma = globalThis;

// Connection limit for Supabase PgBouncer (pooler)
// Supabase free tier: ~20-40 concurrent connections
// Reduce to 3 to leave headroom for cron jobs, migrations, etc.
const CONNECTION_LIMIT = Number(process.env.PRISMA_CONNECTION_LIMIT) || 3;

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Append connection_limit if not already present
  const urlWithPool = databaseUrl.includes("connection_limit=")
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}connection_limit=${CONNECTION_LIMIT}&pool_timeout=30`;

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: urlWithPool,
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

  // Add query monitoring in production
  if (process.env.NODE_ENV === "production") {
    return withQueryMonitoring(client);
  }
  
  return client;
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = db;

// Helper for admin scripts that need direct connection (migrations, seeds)
export function createDirectClient() {
  return new PrismaClient({
    log: ["error"],
    datasourceUrl: process.env.DIRECT_URL,
  });
}
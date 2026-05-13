// src/lib/db.js
// Singleton Prisma client — always reuse `globalThis.prisma` so Vercel
// serverless does not instantiate dozens of clients per cold start (P2024).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = db;

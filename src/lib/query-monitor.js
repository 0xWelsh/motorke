// src/lib/query-monitor.js
// Query performance monitoring for Prisma
// Logs slow queries (>500ms) and tracks query patterns

import { Prisma } from "@prisma/client";

const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS) || 500;
const QUERY_LOG_SAMPLE_RATE = Number(process.env.QUERY_LOG_SAMPLE_RATE) || 0.1; // 10% sampling

// In-memory stats (reset on deploy)
const queryStats = new Map();

export function createQueryMonitor() {
  return {
    async $on(event, callback) {
      if (event === "query") {
        return async (e) => {
          const duration = e.duration;
          const query = e.query;
          const params = e.params;
          
          // Sample logging to avoid overhead
          if (Math.random() > QUERY_LOG_SAMPLE_RATE) return;
          
          if (duration > SLOW_QUERY_THRESHOLD_MS) {
            console.warn(`[SLOW QUERY] ${duration}ms:`, {
              query: query.slice(0, 200),
              params: JSON.stringify(params).slice(0, 200),
            });
          }
          
          // Track stats
          const normalizedQuery = normalizeQuery(query);
          const stats = queryStats.get(normalizedQuery) || { count: 0, totalMs: 0, maxMs: 0 };
          stats.count++;
          stats.totalMs += duration;
          stats.maxMs = Math.max(stats.maxMs, duration);
          queryStats.set(normalizedQuery, stats);
        };
      }
      return callback;
    },
    
    getStats() {
      return Array.from(queryStats.entries())
        .map(([query, stats]) => ({
          query,
          ...stats,
          avgMs: Math.round(stats.totalMs / stats.count),
        }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 20);
    },
    
    resetStats() {
      queryStats.clear();
    },
  };
}

function normalizeQuery(query) {
  // Remove parameter placeholders and normalize whitespace
  return query
    .replace(/\$[0-9]+/g, "?")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

// Middleware to add to Prisma client for production monitoring
export function withQueryMonitoring(prismaClient) {
  if (process.env.NODE_ENV !== "production") return prismaClient;

  const monitor = createQueryMonitor();

  // Extend client with $on for query events
  const originalQueryRaw = prismaClient.$queryRaw.bind(prismaClient);
  const originalQueryRawUnsafe = prismaClient.$queryRawUnsafe.bind(prismaClient);
  const originalExecuteRaw = prismaClient.$executeRaw.bind(prismaClient);
  const originalExecuteRawUnsafe = prismaClient.$executeRawUnsafe.bind(prismaClient);

  // Object.create keeps the real client's prototype chain intact — a
  // spread ({ ...prismaClient }) silently drops prototype methods like
  // $transaction/$connect/$disconnect/$extends, which broke "Publish" in
  // production with "db.$transaction is not a function".
  const wrappedClient = Object.create(prismaClient);

  const timed = (label, fn) => async (...args) => {
    const start = Date.now();
    try {
      return await fn(...args);
    } finally {
      const duration = Date.now() - start;
      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        console.warn(`[SLOW ${label}] ${duration}ms`);
      }
    }
  };

  wrappedClient.$queryRaw = timed("$queryRaw", originalQueryRaw);
  wrappedClient.$queryRawUnsafe = timed("$queryRawUnsafe", originalQueryRawUnsafe);
  wrappedClient.$executeRaw = timed("$executeRaw", originalExecuteRaw);
  wrappedClient.$executeRawUnsafe = timed("$executeRawUnsafe", originalExecuteRawUnsafe);

  return wrappedClient;
}

// Health check endpoint helper
export async function getQueryHealth() {
  const stats = Array.from(queryStats.entries())
    .map(([query, s]) => ({
      query,
      count: s.count,
      avgMs: Math.round(s.totalMs / s.count),
      maxMs: s.maxMs,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 10);
  
  return {
    slowQueries: stats,
    totalQueriesTracked: queryStats.size,
    threshold: SLOW_QUERY_THRESHOLD_MS,
  };
}
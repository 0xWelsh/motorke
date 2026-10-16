# BIDGARI — container image for Oracle Ampere A1 (ARM64).
#
# Oracle's Always Free tier only offers ARM64 compute, so this image targets
# linux/arm64. Build it ON the VM (native arm64) rather than cross-building —
# no emulation, and no QEMU needed on the build machine.
#
# Runtime native modules are sharp (image processing) and bcrypt (password
# hashing). Both ship ARM64 builds; python3/make/g++ are installed as a
# fallback so node-gyp can compile from source if a prebuild is missing.
#
# Chromium/Playwright/Puppeteer and ffmpeg are deliberately NOT installed —
# they are devDependencies and have no runtime consumer under src/.

# ── deps ──────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Prisma and sharp fetch/compile their engines in postinstall, so re-enable it
# just for these packages rather than running every dependency's scripts.
RUN npx prisma generate || true

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# SKIP_PRISMA_MIGRATE_DEPLOY=1 — migrations run from the VM via a dedicated
# one-shot container, not during the image build. The image must be buildable
# without database access.
ENV SKIP_PRISMA_MIGRATE_DEPLOY=1
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 --create-home nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Reinstall production deps in the runner so devDependencies stay out.
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init","--"]
CMD ["node","server.js"]
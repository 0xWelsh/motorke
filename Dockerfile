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

# Browser binaries are dev-only and must not be fetched into the runtime image.
ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Prisma needs the schema before `npm ci`, because the `postinstall` hook runs
# `prisma generate`. Installing with scripts enabled is also required for
# bcrypt (node-gyp) — `--ignore-scripts` silently produced a broken runtime.
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
RUN npm ci

# Drop devDependencies after the client is generated. `.prisma/client` and the
# native engine live inside node_modules and survive the prune.
RUN npm prune --omit=dev

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
# Scripts must run: the root `postinstall` generates the Prisma client.
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# SKIP_PRISMA_MIGRATE_DEPLOY=1 — migrations run from the VM via a dedicated
# one-shot container, not during the image build. The image must be buildable
# without database access.
ENV SKIP_PRISMA_MIGRATE_DEPLOY=1

# NEXT_PUBLIC_* are inlined into the client bundle at build time. They are
# public values (they ship to browsers), so ARGs are safe.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_MAIL_SUPPORT
ARG NEXT_PUBLIC_SUPPORT_PHONE
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_MAIL_SUPPORT=$NEXT_PUBLIC_MAIL_SUPPORT \
    NEXT_PUBLIC_SUPPORT_PHONE=$NEXT_PUBLIC_SUPPORT_PHONE \
    NEXT_PUBLIC_SUPPORT_WHATSAPP=$NEXT_PUBLIC_SUPPORT_WHATSAPP

# DATABASE_URL/DIRECT_URL are only needed so prerendering can read the DB.
# Passed as BuildKit secrets: never in image history, layers, or CI logs.
RUN --mount=type=secret,id=database_url \
    --mount=type=secret,id=direct_url \
    DATABASE_URL="$(cat /run/secrets/database_url 2>/dev/null || echo '')" \
    DIRECT_URL="$(cat /run/secrets/direct_url 2>/dev/null || echo '')" \
    npm run build

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

# Standalone output is a self-contained app root: server.js, `.next/`, and a
# traced node_modules. Unpack it at /app so `process.chdir(__dirname)` lands on
# a complete tree.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Overlay the full production node_modules (Prisma engine, sharp, bcrypt) —
# the traced set is a subset and misses some native optional deps.
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# ISR writes go to `.next/cache`; the app user must own it or every
# regeneration fails at runtime.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init","--"]
CMD ["node","server.js"]
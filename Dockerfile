# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine

# =============================================================================
# IranKetab extractor dependencies
# =============================================================================
FROM ${NODE_IMAGE} AS extractor-deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY packages/iranketab-extractor/package.json \
     packages/iranketab-extractor/package-lock.json \
     ./packages/iranketab-extractor/

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --prefix packages/iranketab-extractor \
      --fetch-retries=5 \
      --fetch-retry-factor=2 \
      --fetch-retry-mintimeout=10000 \
      --fetch-retry-maxtimeout=120000


# =============================================================================
# IranKetab extractor build
# =============================================================================
FROM ${NODE_IMAGE} AS extractor-builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=extractor-deps \
     /app/packages/iranketab-extractor/node_modules \
     ./packages/iranketab-extractor/node_modules

COPY packages/iranketab-extractor/package.json \
     packages/iranketab-extractor/tsconfig.json \
     ./packages/iranketab-extractor/

COPY packages/iranketab-extractor/src \
     ./packages/iranketab-extractor/src

RUN echo "=== EXTRACTOR BUILD START ===" \
 && date -u \
 && npm run build --prefix packages/iranketab-extractor \
 && date -u \
 && echo "=== EXTRACTOR BUILD END ==="


# =============================================================================
# Root dependencies
# =============================================================================
FROM ${NODE_IMAGE} AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./

COPY packages/iranketab-extractor/package.json \
     ./packages/iranketab-extractor/package.json

COPY --from=extractor-builder \
     /app/packages/iranketab-extractor/dist \
     ./packages/iranketab-extractor/dist

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --fetch-retries=5 \
      --fetch-retry-factor=2 \
      --fetch-retry-mintimeout=10000 \
      --fetch-retry-maxtimeout=120000


# =============================================================================
# Next.js production build
# =============================================================================
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules

COPY --from=extractor-builder \
     /app/packages/iranketab-extractor/dist \
     ./packages/iranketab-extractor/dist

COPY . .

# These values are public and are inlined into the frontend bundle.
# Never pass DATABASE_URL or other secrets as build arguments.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# `next build` already performs production TypeScript validation.
# Keep `npm run typecheck` in CI/local validation instead of running it twice.
RUN echo "=== NEXT BUILD START ===" \
 && date -u \
 && npm run build \
 && date -u \
 && echo "=== NEXT BUILD END ==="

# Fail clearly if standalone output was not generated.
RUN test -f /app/.next/standalone/server.js \
 && test -d /app/.next/static \
 && echo "Standalone output verified."


# =============================================================================
# Production runtime
# =============================================================================
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy the standalone server and its traced production dependencies.
COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static \
     ./.next/static

# next-pwa may generate service-worker files during build.
COPY --from=builder --chown=nextjs:nodejs \
     /app/public \
     ./public

# Runtime database/prestart resources.
COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle \
     ./drizzle

COPY --from=builder --chown=nextjs:nodejs \
     /app/db \
     ./db

COPY --from=builder --chown=nextjs:nodejs \
     /app/lib \
     ./lib

COPY --from=builder --chown=nextjs:nodejs \
     /app/scripts \
     ./scripts

COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle.config.* \
     ./

# Keep package metadata because the prestart script currently uses npm scripts.
COPY --from=builder --chown=nextjs:nodejs \
     /app/package.json \
     ./package.json

COPY --chown=nextjs:nodejs \
     docker-entrypoint.sh \
     ./docker-entrypoint.sh

RUN chmod 0755 ./docker-entrypoint.sh \
 && test -f ./server.js \
 && test -f ./scripts/prestart-production.mjs

USER nextjs

EXPOSE 3005

ENTRYPOINT ["./docker-entrypoint.sh"]

# Standalone output must be started directly.
# Do not use `next start`; the full Next CLI is not installed in this image.
CMD ["node", "server.js"]
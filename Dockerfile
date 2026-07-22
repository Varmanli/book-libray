ARG NODE_IMAGE=node:22-alpine

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

RUN npm run build --prefix packages/iranketab-extractor


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
      --include=dev \
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

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG GIT_COMMIT_SHA=unknown
ARG IMAGE_BUILD_ID=unknown

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

RUN echo "=== NEXT BUILD START ===" \
    && date -u \
    && npm run build \
    && date -u \
    && echo "=== NEXT BUILD END ==="

RUN node scripts/generate-migration-manifest.mjs /app/migration-manifest.json \
    && test -f /app/migration-manifest.json \
    && test -f /app/drizzle/0037_public_book_thoughts.sql

RUN test -f /app/.next/standalone/server.js \
    && test -d /app/.next/static \
    && echo "Standalone output verified"


# =============================================================================
# Production runtime
# =============================================================================
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && apk add --no-cache curl postgresql-client \
    && mkdir -p /app/backups \
    && chown nextjs:nodejs /app/backups

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static \
     ./.next/static

COPY --from=builder --chown=nextjs:nodejs \
     /app/public \
     ./public


# Production database repair dependencies
COPY --from=deps --chown=nextjs:nodejs \
     /app/node_modules \
     ./node_modules

COPY --from=builder --chown=nextjs:nodejs \
     /app/package.json \
     /app/drizzle.config.ts \
     /app/migration-manifest.json \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle \
     ./drizzle

COPY --from=builder --chown=nextjs:nodejs \
     /app/db \
     ./db

COPY --from=builder --chown=nextjs:nodejs \
     /app/scripts/migration-preflight.mjs \
     /app/scripts/run-production-migrations.mjs \
     /app/scripts/backup-production-db.mjs \
     ./scripts/


# =============================================================================
# Container entrypoint
# =============================================================================
COPY --chown=nextjs:nodejs \
     docker-entrypoint.sh \
     ./docker-entrypoint.sh

RUN chmod 0755 ./docker-entrypoint.sh \
    && test -f ./server.js \
    && test -f ./scripts/run-production-migrations.mjs \
    && test -f ./scripts/backup-production-db.mjs \
    && test -f ./drizzle/0037_public_book_thoughts.sql \
    && test -f ./migration-manifest.json \
    && echo "Runtime application assets verified"

USER nextjs

EXPOSE 3000

VOLUME ["/app/backups"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -fsS http://127.0.0.1:3000/api/health >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "server.js"]

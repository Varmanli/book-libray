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
# Production migration dependencies
# =============================================================================
# drizzle-kit must be available inside the final image because the entrypoint
# runs the repository's official migration command before starting Next.js.
#
# This stage produces an isolated production-only node_modules directory for
# /app/migration. No dependency installation occurs during container startup.
FROM deps AS migration-deps

RUN npm prune --omit=dev


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

RUN test -f /app/.next/standalone/server.js \
 && test -d /app/.next/static \
 && echo "Standalone output verified."


# =============================================================================
# Migration release manifest
# =============================================================================
# The manifest binds the runtime migration files to this build using hashes and
# non-secret release identifiers.
RUN mkdir -p /app/.runtime \
 && GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
    IMAGE_BUILD_ID="${IMAGE_BUILD_ID}" \
    node /app/scripts/generate-migration-manifest.mjs \
      /app/.runtime/migration-manifest.json \
 && test -f /app/.runtime/migration-manifest.json


# =============================================================================
# Production migration gate bundle
# =============================================================================
# Bundle the migration runner as CommonJS. This avoids esbuild ESM dynamic
# require issues with pg and Node built-ins.
#
# The legacy prod-db-repair script is intentionally not bundled or executed.
# All production schema changes must pass through committed Drizzle migrations.
RUN test -x /app/node_modules/.bin/esbuild \
 && /app/node_modules/.bin/esbuild \
      /app/scripts/run-production-migrations.mjs \
      --bundle \
      --platform=node \
      --target=node22 \
      --format=cjs \
      --external:pg-native \
      --outfile=/app/.runtime/run-production-migrations.cjs \
 && test -f /app/.runtime/run-production-migrations.cjs \
 && node -e "\
const fs = require('fs'); \
const source = fs.readFileSync('/app/.runtime/run-production-migrations.cjs', 'utf8'); \
const requiredMarkers = ['pg_try_advisory_lock', 'db:migrate']; \
for (const marker of requiredMarkers) { \
  if (!source.includes(marker)) { \
    console.error('Migration bundle is missing required marker:', marker); \
    process.exit(1); \
  } \
} \
console.log('Production migration gate verified.');"


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
 && adduser --system --uid 1001 nextjs \
 && apk add --no-cache curl

# Next.js standalone application.
COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static \
     ./.next/static

COPY --from=builder --chown=nextjs:nodejs \
     /app/public \
     ./public


# =============================================================================
# Runtime migration workdir
# =============================================================================
# Isolated dependencies required by:
# npm run db:migrate
COPY --from=migration-deps --chown=nextjs:nodejs \
     /app/node_modules \
     ./migration/node_modules

COPY --from=builder --chown=nextjs:nodejs \
     /app/package.json \
     /app/package-lock.json \
     /app/drizzle.config.ts \
     ./migration/

COPY --from=builder --chown=nextjs:nodejs \
     /app/db/schema.ts \
     ./migration/db/schema.ts

COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle \
     ./migration/drizzle

COPY --from=builder --chown=nextjs:nodejs \
     /app/.runtime/migration-manifest.json \
     ./migration/migration-manifest.json

COPY --from=builder --chown=nextjs:nodejs \
     /app/.runtime/run-production-migrations.cjs \
     ./scripts/run-production-migrations.cjs


# =============================================================================
# Container entrypoint
# =============================================================================
COPY --chown=nextjs:nodejs \
     docker-entrypoint.sh \
     ./docker-entrypoint.sh

RUN chmod 0755 ./docker-entrypoint.sh \
 && test -f ./server.js \
 && test -f ./scripts/run-production-migrations.cjs \
 && test -f ./migration/package.json \
 && test -f ./migration/package-lock.json \
 && test -f ./migration/drizzle.config.ts \
 && test -f ./migration/db/schema.ts \
 && test -f ./migration/migration-manifest.json \
 && test -f ./migration/drizzle/meta/_journal.json \
 && test -f ./migration/drizzle/0033_iranketab_preview_operations.sql \
 && test -x ./migration/node_modules/.bin/drizzle-kit \
 && echo "Runtime application and migration assets verified."

USER nextjs

EXPOSE 3005

# Startup includes migration preflight, advisory-lock acquisition, migration,
# and postflight verification. Give the container enough time to finish these
# steps before Coolify starts counting healthcheck failures.
HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=180s \
  --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

# docker-entrypoint.sh runs the guarded migration process first and then uses
# exec to launch this command.
CMD ["node", "server.js"]
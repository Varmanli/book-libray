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


# `drizzle-kit` is a production dependency because container startup invokes
# the official migration command. Prune only development dependencies for the
# isolated migration workdir copied into the final image.
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

# Bundle production startup scripts and their CommonJS dependencies.
# pg is CommonJS; keeping this bundle CommonJS avoids esbuild's ESM dynamic
# require shim failure ("Dynamic require of events is not supported").
RUN mkdir -p /app/.runtime \
 && test -x /app/node_modules/.bin/esbuild \
 && /app/node_modules/.bin/esbuild \
      /app/scripts/prod-db-repair.mjs \
      --bundle \
      --platform=node \
      --target=node22 \
      --format=cjs \
      --external:pg-native \
      --outfile=/app/.runtime/prod-db-repair.cjs \
 && test -f /app/.runtime/prod-db-repair.cjs \
 && node -e "const fs=require('fs'); const source=fs.readFileSync('/app/.runtime/prod-db-repair.cjs','utf8'); if (!source.includes('BookEditionContributor') || !source.includes('to_regclass')) process.exit(1); console.log('Repair SQL/schema embedded in CommonJS bundle.')" \
 && /app/node_modules/.bin/esbuild \
      /app/scripts/run-production-migrations.mjs \
      --bundle \
      --platform=node \
      --target=node22 \
      --format=cjs \
      --external:pg-native \
      --outfile=/app/.runtime/run-production-migrations.cjs \
 && test -f /app/.runtime/run-production-migrations.cjs \
 && node -e "const fs=require('fs'); const source=fs.readFileSync('/app/.runtime/run-production-migrations.cjs','utf8'); if (!source.includes('pg_try_advisory_lock') || !source.includes('db:migrate')) process.exit(1); console.log('Migration gate embedded in CommonJS bundle.')" \
 && node /app/.runtime/prod-db-repair.cjs


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

# Standalone includes only the production dependencies traced by Next.
COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static \
     ./.next/static

COPY --from=builder --chown=nextjs:nodejs \
     /app/public \
     ./public

# Bundled DB repair executable.
COPY --from=builder --chown=nextjs:nodejs \
     /app/.runtime/prod-db-repair.cjs \
     ./scripts/prod-db-repair.cjs

# The migration gate invokes the repository's official `npm run db:migrate`
# command. Keep its isolated runtime inputs in the final image; no network
# installation occurs when the container starts.
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

# Keep the complete migration SQL directory, journal, and metadata in both
# the migration workdir and the application workdir for existing repair code.
COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle \
     ./migration/drizzle

COPY --from=builder --chown=nextjs:nodejs \
     /app/drizzle \
     ./drizzle

COPY --from=builder --chown=nextjs:nodejs \
     /app/.runtime/run-production-migrations.cjs \
     ./scripts/run-production-migrations.cjs

COPY --chown=nextjs:nodejs \
     docker-entrypoint.sh \
     ./docker-entrypoint.sh

RUN chmod 0755 ./docker-entrypoint.sh \
 && test -f ./server.js \
 && test -f ./scripts/prod-db-repair.cjs \
 && test -f ./scripts/run-production-migrations.cjs \
 && test -f ./migration/drizzle/meta/_journal.json \
 && test -f ./migration/drizzle/0033_iranketab_preview_operations.sql \
 && test -x ./migration/node_modules/.bin/drizzle-kit

USER nextjs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

# Standalone Next.js must run directly through server.js.
CMD ["node", "server.js"]

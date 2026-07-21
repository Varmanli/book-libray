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
 && apk add --no-cache curl

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone \
     ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static \
     ./.next/static

COPY --from=builder --chown=nextjs:nodejs \
     /app/public \
     ./public

# The startup repair is intentionally separate from Next.js' standalone trace.
# Copy its production dependencies and scripts so it can run before server.js.
COPY --from=deps --chown=nextjs:nodejs \
     /app/node_modules \
     ./node_modules

COPY --from=builder --chown=nextjs:nodejs \
     /app/scripts/prod-db-repair.mjs \
     /app/scripts/load-script-env.mjs \
     ./scripts/


# =============================================================================
# Container entrypoint
# =============================================================================
COPY --chown=nextjs:nodejs \
     docker-entrypoint.sh \
     ./docker-entrypoint.sh

RUN chmod 0755 ./docker-entrypoint.sh \
 && test -f ./server.js \
 && test -f ./scripts/prod-db-repair.mjs \
 && echo "Runtime application assets verified."


ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["node", "server.js"]

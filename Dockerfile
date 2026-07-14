# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine

# -----------------------------------------------------------------------------
# deps: install dependencies reproducibly
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS extractor-deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY packages/iranketab-extractor/package.json packages/iranketab-extractor/package-lock.json ./packages/iranketab-extractor/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefix packages/iranketab-extractor \
  --fetch-retries=5 \
  --fetch-retry-factor=2 \
  --fetch-retry-mintimeout=10000 \
  --fetch-retry-maxtimeout=120000

FROM ${NODE_IMAGE} AS extractor-builder

WORKDIR /app
COPY --from=extractor-deps /app/packages/iranketab-extractor/node_modules ./packages/iranketab-extractor/node_modules
COPY packages/iranketab-extractor/package.json packages/iranketab-extractor/tsconfig.json ./packages/iranketab-extractor/
COPY packages/iranketab-extractor/src ./packages/iranketab-extractor/src
RUN npm run build --prefix packages/iranketab-extractor

FROM ${NODE_IMAGE} AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY packages/iranketab-extractor/package.json ./packages/iranketab-extractor/
COPY --from=extractor-builder /app/packages/iranketab-extractor/dist ./packages/iranketab-extractor/dist

# -----------------------------------------------------------------------------
# builder: typecheck + build
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/iranketab-extractor/dist ./packages/iranketab-extractor/dist
COPY . .

# NEXT_PUBLIC_* values are public and can be safely inlined at build time.
# DATABASE_URL must NOT be passed here.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

RUN echo "=== TYPECHECK START ===" \
 && date -u \
 && npm run typecheck \
 && date -u \
 && echo "=== TYPECHECK END ==="
RUN echo "=== NEXT BUILD START ===" \
 && date -u \
 && npm run build \
 && date -u \
 && echo "=== NEXT BUILD END ==="


# -----------------------------------------------------------------------------
# runner: production runtime image
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# The standalone output contains the traced production dependencies (including
# sharp/libvips and pg). Avoid a second npm install in the runtime stage: it
# duplicates dependencies, increases image size, and makes an otherwise-built
# image depend on another registry download.
COPY package.json package-lock.json ./

# Keep migration/schema files in the deployment artifact. Migrations are run as
# an explicit release step, never implicitly by the image build.
COPY --from=builder /app/drizzle.config.* ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts ./scripts

# next-pwa writes generated service worker files into public/ during build.
COPY --from=builder /app/public ./public

# Next standalone output.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Entrypoint runs database schema sync before starting the Next.js server.
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3005

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start:next"]

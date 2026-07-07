ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine

# -----------------------------------------------------------------------------
# deps: install dependencies reproducibly
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./

RUN npm ci


# -----------------------------------------------------------------------------
# builder: typecheck + build
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are public and can be safely inlined at build time.
# DATABASE_URL must NOT be passed here.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

RUN npx tsc --noEmit
RUN npm run build


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

# Install dependencies needed at runtime.
# IMPORTANT:
# We intentionally install devDependencies too because db:push often depends on
# drizzle-kit, which is usually in devDependencies.
#
# Later, after production is stable, you can optimize this by moving the exact
# migration/sync tool to dependencies and changing this to:
# RUN npm ci --omit=dev && npm cache clean --force
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy files needed by db:push / Drizzle / database schema sync.
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

# Production Dockerfile for ghafaseh (Next.js + next-pwa, standalone output).
# Designed for Coolify's Dockerfile build pack.
# Secrets must be provided by Coolify environment variables, not hardcoded here.

# Use public ECR mirror instead of Docker Hub to avoid Docker Hub 403/rate-limit issues.
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine

# ---- deps: install dependencies reproducibly -------------------------------
FROM ${NODE_IMAGE} AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./

RUN npm ci


# ---- builder: typecheck + build --------------------------------------------
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time.
# DATABASE_URL is only needed at build time because this project runs db:push
# and some Next files may import DB code during build.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG DATABASE_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV DATABASE_URL=${DATABASE_URL}

RUN npx tsc --noEmit
RUN npm run db:push
RUN npm run build


# ---- runner: minimal production image --------------------------------------
FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# next-pwa writes generated service worker files into public/ during build.
COPY --from=builder /app/public ./public

# Next standalone output.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3005

# Runtime secrets must be configured in Coolify:
# DATABASE_URL, JWT_SECRET, S3_*, GOOGLE_CLIENT_SECRET, etc.
CMD ["node", "server.js"]
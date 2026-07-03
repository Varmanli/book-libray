# Production Dockerfile for ghafaseh (Next.js + next-pwa, standalone output).
# Designed for Coolify's "Dockerfile" build pack. No secrets are baked in —
# all values below are supplied by Coolify's build/runtime environment.

# ---- deps: install dependencies reproducibly -------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: typecheck + build --------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time — Coolify must provide these
# as build-time variables. DATABASE_URL is also read at build time by pages
# that import the DB client at module scope, and by db:push below — it must
# be a real, reachable connection string at build time (Coolify's Docker
# build must be able to reach the database over the network).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production

RUN npx tsc --noEmit
RUN npm run db:push
RUN npm run build

# ---- runner: minimal production image --------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# next-pwa writes its generated service worker files into public/ during
# build — copying public/ after the build picks those up automatically.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3005

# Real secrets (DATABASE_URL, JWT_SECRET, S3_*, GOOGLE_CLIENT_SECRET) must be
# provided as runtime environment variables in Coolify — never baked into
# this image. The schema is applied during the builder stage (above, via
# db:push, since this project has no tracked migration journal); no seed
# command runs here.
CMD ["node", "server.js"]

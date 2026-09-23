# syntax=docker/dockerfile:1
#
# Production image for the Medusa backend (@leyros/medusa).
#
# This is a pnpm workspace, so the build needs the monorepo root as its
# context (package.json, pnpm-workspace.yaml, pnpm-lock.yaml all live there).
# On Railway: set the service's Root Directory to the repo root ("/") and
# set Dockerfile Path to "apps/medusa/Dockerfile" (railway.json at the repo
# root already does this for you on first deploy).

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /repo

# ---- deps: install only what @leyros/medusa needs, cached by manifest files ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/medusa/package.json apps/medusa/package.json
COPY apps/storefront/package.json apps/storefront/package.json
COPY apps/sanity-studio/package.json apps/sanity-studio/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --filter @leyros/medusa... --frozen-lockfile

# ---- build: compile the Medusa app into .medusa/server ----
FROM deps AS build
COPY apps/medusa apps/medusa
COPY packages packages
RUN pnpm --filter @leyros/medusa build

# ---- runtime: standalone .medusa/server output with production deps only ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/medusa/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund

EXPOSE 9000
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]

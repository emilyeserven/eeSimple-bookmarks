FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

ENV NODE_ENV="production"


# Dependency stage — download keyed on the lockfile alone, install keyed on manifests
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store NODE_ENV=development pnpm fetch

COPY packages/types/package.json ./packages/types/
COPY packages/middleware/package.json ./packages/middleware/
COPY packages/client/package.json ./packages/client/
COPY packages/extension/package.json ./packages/extension/
COPY packages/gateway/package.json ./packages/gateway/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store NODE_ENV=development pnpm install --frozen-lockfile --offline

COPY tsconfig.json ./


# Per-package build stages — types, middleware, and client build in parallel
FROM deps AS build-types

COPY packages/types ./packages/types/
RUN pnpm --filter @eesimple/types build


# Middleware is transpile-only (--noCheck), so it doesn't need types/dist to emit — branch off
# `deps` instead of `build-types` so it runs in parallel with the types build rather than after it.
# Only the final image needs types/dist, which it copies from build-types.
FROM deps AS build-middleware

COPY packages/middleware ./packages/middleware/
# Transpile-only: CI owns the type gate (.github/workflows/ci.yml), so skip it here for speed.
RUN pnpm --filter @eesimple/middleware exec tsc -p tsconfig.build.json --noCheck \
 && pnpm --filter @eesimple/middleware exec tsc-alias -p tsconfig.build.json --resolve-full-paths


FROM build-types AS build-client

# The browser extension (WXT) builds first: the client imports its fill engine for the in-app rule
# preview, and the client build copies its .zip into dist/ for the Extension settings download.
COPY packages/extension ./packages/extension/
RUN pnpm --filter @eesimple/extension build
COPY packages/client ./packages/client/
RUN pnpm --filter @eesimple/client build

# Storybook is an optional /storybook artifact, gated at runtime on DOCS_ENABLED (see server.js,
# which also tolerates it being absent). Set the BUILD_STORYBOOK build arg to 0 to skip the build
# entirely for a faster image build (declared between the two RUNs so toggling it never busts the
# Vite layer's cache). When it does run it is best-effort: the build is memory-heavy (~1.5 GB) and
# was repeatedly OOM-killed on modest Coolify build hosts, failing the whole deploy — a failure
# must NOT block the deploy. `mkdir -p` guarantees the COPY target exists even when the build is
# skipped or fails. CI builds Storybook on a roomy runner (.github/workflows/ci.yml) to catch real
# regressions, so neither skipping nor masking a failure here loses the regression gate.
ARG BUILD_STORYBOOK=1
RUN if [ "$BUILD_STORYBOOK" = "1" ] || [ "$BUILD_STORYBOOK" = "true" ]; then \
      pnpm --filter @eesimple/client run build-storybook \
      || echo "::warning:: Storybook build failed; deploying without /storybook (CI gates Storybook regressions)"; \
    else \
      echo "Skipping Storybook build (BUILD_STORYBOOK=$BUILD_STORYBOOK)"; \
    fi \
 && mkdir -p packages/client/storybook-static


# Production stage — fresh install with only production deps (client ships as static files)
FROM base AS prod-deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/middleware/package.json ./packages/middleware/
COPY packages/client/package.json ./packages/client/
COPY packages/extension/package.json ./packages/extension/
COPY packages/gateway/package.json ./packages/gateway/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts --filter '!@eesimple/client' --filter '!@eesimple/extension'


# Final stage
FROM base

WORKDIR /app

# Production node_modules
COPY --from=prod-deps /app /app

# Built artifacts
COPY --from=build-types /app/packages/types/dist/ ./packages/types/dist/
COPY --from=build-types /app/packages/types/src/ ./packages/types/src/
COPY --from=build-middleware /app/packages/middleware/dist/ ./packages/middleware/dist/
COPY --from=build-middleware /app/packages/middleware/src/ ./packages/middleware/src/
COPY --from=build-middleware /app/packages/middleware/drizzle.config.ts ./packages/middleware/drizzle.config.ts
COPY --from=build-client /app/packages/client/dist/ ./packages/client/dist/
COPY --from=build-client /app/packages/client/storybook-static/ ./packages/client/storybook-static/
COPY packages/gateway/server.js ./packages/gateway/server.js

WORKDIR /app/packages/gateway

# Run as the unprivileged `node` user (uid 1000) that ships with the official Node image, not root.
# Everything above stays root-owned and read-only to it: at runtime the app only reads its own files
# (drizzle-kit push, the migrations hook, and the middleware talk to Postgres/S3 over the network
# and write nothing to disk), so no chown is needed. Port 3000 is unprivileged, so binding it
# needs no extra capability.
USER node

EXPOSE 3000
CMD ["node", "server.js"]

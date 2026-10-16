# Web Next.js. Contexto de build = raíz del monorepo.
# NEXT_PUBLIC_* se hornea en tiempo de build (el navegador llama a la API).
FROM node:20-bookworm AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SHOW_SOLUTIONS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SHOW_SOLUTIONS=$NEXT_PUBLIC_SHOW_SOLUTIONS
ENV NEXT_TELEMETRY_DISABLED=1

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @secure-crm/shared --filter @secure-crm/web

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @secure-crm/shared build && \
    pnpm --filter @secure-crm/web build && \
    chown -R node:node /app
USER node

EXPOSE 3000
CMD ["pnpm", "--filter", "@secure-crm/web", "start"]

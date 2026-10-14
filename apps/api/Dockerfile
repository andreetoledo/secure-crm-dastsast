# API Express + better-sqlite3. Contexto de build = raíz del monorepo.
FROM node:20-bookworm AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Manifiestos primero (mejor cache)
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @secure-crm/shared --filter @secure-crm/api

# Código
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @secure-crm/shared build && pnpm --filter @secure-crm/api build

# Mitigacion docker:S6471: Asignar propiedad a usuario no privilegiado node
RUN chown -R node:node /app
USER node

EXPOSE 4000
# Al arrancar: si no existe la BD, la crea y puebla; luego inicia el servidor.
CMD ["sh", "-c", "node apps/api/dist/seed.js && node apps/api/dist/index.js"]

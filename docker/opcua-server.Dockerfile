FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# ── Bağımlılıklar ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/opcua-server/package.json ./apps/opcua-server/
RUN pnpm install --filter opcua-server --frozen-lockfile

# ── Çalışma zamanı ────────────────────────────────────────────────────────────
FROM deps AS runner
WORKDIR /app
COPY packages/types ./packages/types
COPY apps/opcua-server/src ./apps/opcua-server/src
COPY apps/opcua-server/tsconfig.json ./apps/opcua-server/

WORKDIR /app/apps/opcua-server
EXPOSE 4840
CMD ["pnpm", "start"]

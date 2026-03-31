FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# ── Bağımlılıklar ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --no-frozen-lockfile

# ── Derleme ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm --filter api build

# ── Çalışma zamanı ────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Package dosyalarını kopyala
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/types/src ./packages/types/src

# Sadece production bağımlılıklarını kur (symlink sorunu olmaz)
RUN pnpm install --no-frozen-lockfile --prod

# Derlenmiş dosyaları ve migration'ları kopyala
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/db/migrations ./apps/api/dist/db/migrations

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]

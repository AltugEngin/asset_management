FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# ── Bağımlılıklar ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --no-frozen-lockfile

# ── Derleme ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm --filter web build

# ── Nginx ile servis ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

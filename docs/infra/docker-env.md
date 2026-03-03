# Infrastructure: Docker & Environment

**Source**: `Dockerfile`, `docker-compose.yaml`, `src/env.mjs`
**Related**: → `risks/security.md` (Docker/env security issues)

---

## Docker Services

```
Traefik v3.6.1 (port 80)
    │  HTTP routing via Docker labels
    ▼
lrwh-app (Next.js, port 3000)
    │  pg driver
    ▼
postgres:15-alpine (internal only, port 5432 not exposed)

Network: traefik (bridge)
```

---

## Dockerfile — Multi-Stage Build

### Stage 1: `deps`
```dockerfile
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile
```

### Stage 2: `builder`
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm run build
```
`pnpm` installed globally twice (deps + builder) — minor inefficiency. `COPY . .` copies entire context including `.git`, `docs`, local `.env`.

### Stage 3: `runner` (production image)
```dockerfile
FROM node:22-alpine AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs
USER nextjs
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

Non-root user, Alpine base, standalone output. No health check.

---

## Docker Compose Services

### `reverse-proxy` (Traefik)
```yaml
image: traefik:v3.6.1
ports: ["80:80"]
volumes:
  - /var/run/docker.sock:/var/run/docker.sock   # ← security risk
```
No HTTPS, no TLS, no Traefik dashboard auth configured.

### `postgres`
```yaml
image: postgres:15-alpine
environment:
  POSTGRES_USER: lrwhuser
  POSTGRES_PASSWORD: lrwhpassword              # hardcoded in version-controlled file
  POSTGRES_DB: lrwhdb
volumes:
  - lrwh-postgres-data:/var/lib/postgresql/data
restart: always
```
Port 5432 not exposed to host (internal network only). Credentials hardcoded.

### `lrwh-app`
```yaml
build: { context: ., dockerfile: Dockerfile }
environment:
  NODE_ENV: production
volumes:
  - lrwh-app-logs:/app/logs
labels:
  traefik.enable: "true"
  traefik.http.routers.lrwh-app.rule: >
    Host(`lrwhgift.my.id`) || Host(`www.lrwhgift.my.id`) || Host(`localhost`)
  traefik.http.services.lrwh-app.loadbalancer.server.port: "3000"
restart: always
```

App secrets (`SESSION_PASSWORD`, `SESSION_SECRET`, `AWS_*`, `DATABASE_URL`) are NOT defined in the compose file. They must be injected via `.env` file or `--env-file` at runtime.

---

## Environment Variables

All validated at startup by `src/env.mjs` using `@t3-oss/env-nextjs`.

| Variable | Validator | Used In |
|---|---|---|
| `SESSION_PASSWORD` | `string().min(32)` | iron-session AES encryption |
| `SESSION_SECRET` | `string().min(32)` | JWT signing (`jose`) |
| `SESSION_EXPIRATION_TIME` | `string()` | JWT expiry (e.g. `"8h"`) |
| `DATABASE_URL` | `string().url()` | pg Pool connection |
| `AWS_S3_ACCESS_KEY` | `string()` | S3Client credentials |
| `AWS_S3_SECRET_ACCESS_KEY` | `string()` | S3Client credentials |
| `AWS_S3_URL` | `string().url()` | S3Client endpoint + file URL base |
| `AWS_S3_BUCKET_NAME` | `string()` | All S3 commands |
| `NEXT_PUBLIC_APP_URL` | `string().url()` | Client-side (public) |

**`.env.example` is outdated**: Lists `JWT_SECRET` (→ actual: `SESSION_SECRET`) and `AWS_BUCKET_NAME` (→ actual: `AWS_S3_BUCKET_NAME`). Developers following `.env.example` will set wrong variable names.

---

## Volumes

| Volume | Service | Path | Content |
|---|---|---|---|
| `lrwh-postgres-data` | postgres | `/var/lib/postgresql/data` | DB files |
| `lrwh-app-logs` | lrwh-app | `/app/logs` | Winston log files |
| `/var/run/docker.sock` | reverse-proxy | same | Docker daemon socket |

---

## Logging

Winston v3.19.0 with daily rotation (`winston-daily-rotate-file`):
- `logs/app-YYYY-MM-DD.log` — all levels
- `logs/error-YYYY-MM-DD.log` — errors only
- Rotation: daily + 10MB size cap, 14-day retention
- Console: colorized in dev, JSON in prod

Source: `src/shared/lib/logger.ts`

---

## No `.dockerignore`

No `.dockerignore` file detected. `COPY . .` in builder stage includes:
- `.git/` — increases build context size
- Local `.env` files — potential secret leakage into build layer
- `docs/` — unnecessary in final image
- Local `node_modules/` if present

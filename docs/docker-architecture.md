# Docker Architecture

## Overview

Three services orchestrated via Docker Compose:
1. **Traefik** — Reverse proxy / load balancer
2. **PostgreSQL** — Database
3. **lrwh-app** — Next.js application

All services share a single Docker network: `traefik` (bridge driver).

---

## Dockerfile

**File**: `Dockerfile`
**Base image**: `node:22-alpine`
**Build type**: Multi-stage (3 stages)

### Stage 1: `deps` — Dependency Installation

```dockerfile
FROM node:22-alpine AS base
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile
```

**Purpose**: Install production + dev dependencies using locked versions.
**Notes**:
- `libc6-compat` added for Node.js native module compatibility on Alpine
- `pnpm` installed globally via `npm install -g pnpm` — not cached as a layer before COPY (minor inefficiency)

### Stage 2: `builder` — Application Build

```dockerfile
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm run build
```

**Purpose**: Compile Next.js app.
**Notes**:
- `npm install -g pnpm` repeated from deps stage — not shared across stages (inefficiency)
- `next build` generates `.next/standalone` output (configured via `output: 'standalone'`)
- Environment variables from `.env` are NOT available during build (must be set at runtime)
- Next.js telemetry is enabled (no `ENV NEXT_TELEMETRY_DISABLED=1`)

### Stage 3: `runner` — Production Image

```dockerfile
FROM base AS runner
WORKDIR /app
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

**Purpose**: Minimal production runtime image.
**Security hardening**:
- ✅ Non-root user `nextjs` (uid 1001)
- ✅ System group `nodejs` (gid 1001)
- ✅ `chown` applied to application files
- ✅ Alpine base (smaller attack surface)
- ✅ `output: 'standalone'` minimizes included files

---

## Docker Compose

**File**: `docker-compose.yaml`

### Service: `reverse-proxy`

```yaml
image: traefik:v3.6.1
command:
  - "--providers.docker=true"
  - "--providers.docker.exposedbydefault=false"
  - "--providers.docker.network=traefik"
  - "--entrypoints.web.address=:80"
ports:
  - "80:80"
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Role**: HTTP reverse proxy, auto-discovers services via Docker labels.
**Ports**: Port 80 exposed to host.
**Security issues**:
- ⚠️ Docker socket mounted (`/var/run/docker.sock`) — gives Traefik full Docker daemon access. Container compromise = host compromise.
- ⚠️ No HTTPS configured (HTTP only, no TLS termination, no ACME/Let's Encrypt configured)
- ⚠️ No Traefik dashboard configured (not exposed, but also not explicitly disabled)

### Service: `postgres`

```yaml
image: postgres:15-alpine
environment:
  POSTGRES_USER: lrwhuser
  POSTGRES_PASSWORD: lrwhpassword    # hardcoded in compose file
  POSTGRES_DB: lrwhdb
volumes:
  - lrwh-postgres-data:/var/lib/postgresql/data
restart: always
```

**Network**: `traefik` only (no port exposed to host — port 5432 binding is commented out).
**Storage**: Named volume `lrwh-postgres-data` for persistence.
**Security issues**:
- ⚠️ Hardcoded credentials in `docker-compose.yaml` — not using Docker secrets or env_file
- ⚠️ Default postgres credentials in compose file (`lrwhpassword`)
- ✅ Port 5432 NOT exposed to host (internal network only)
- ✅ Alpine base image
- ⚠️ Database URL is composed separately in environment variable (`DATABASE_URL`) injected to app — must match these credentials

### Service: `lrwh-app`

```yaml
build:
  context: .
  dockerfile: Dockerfile
environment:
  NODE_ENV: production
volumes:
  - lrwh-app-logs:/app/logs
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=traefik"
  - "traefik.http.routers.lrwh-app.rule=Host(`lrwhgift.my.id`) || Host(`www.lrwhgift.my.id`) || Host(`localhost`)"
  - "traefik.http.routers.lrwh-app.entrypoints=web"
  - "traefik.http.services.lrwh-app.loadbalancer.server.port=3000"
restart: always
```

**Exposed**: Via Traefik on port 80. Domains: `lrwhgift.my.id`, `www.lrwhgift.my.id`, `localhost`.
**Internal port**: 3000.
**Log persistence**: Named volume `lrwh-app-logs` mounted to `/app/logs`.
**Security issues**:
- ⚠️ Environment variables (secrets) NOT defined in compose file — must be injected at runtime (via `.env` file or `docker run --env-file`). The compose file doesn't define `DATABASE_URL`, `SESSION_PASSWORD`, `AWS_S3_*`, etc. This is correct but could lead to silent failures if vars aren't set.
- ✅ `NODE_ENV=production` set
- ⚠️ No health check defined

---

## Networking

```
Host → :80 → Traefik (lrwh-reverse-proxy)
                 │
                 └─→ lrwh-app:3000 (HTTP, via traefik network)

lrwh-app → lrwh-postgres:5432 (via traefik network, internal)
```

All services on `traefik` bridge network. PostgreSQL is only accessible from within the Docker network.

---

## Volume Mounting

| Volume | Service | Mount Point | Purpose |
|---|---|---|---|
| `lrwh-postgres-data` | postgres | `/var/lib/postgresql/data` | DB persistence |
| `lrwh-app-logs` | lrwh-app | `/app/logs` | Winston log persistence |
| `/var/run/docker.sock` | reverse-proxy | `/var/run/docker.sock` | Traefik service discovery |

---

## Environment Variable Injection Strategy

**Pattern**: Environment variables are NOT hardcoded in the compose file (for app secrets). They must be provided externally at runtime.

**Recommended approach** (not explicitly defined in repo):
```bash
docker compose --env-file .env up -d
```

Or via a `.env` file at the compose project root (automatically loaded by Docker Compose).

**`.env.example`** lists the required variables:
```
NEXT_PUBLIC_APP_URL=
SESSION_PASSWORD=
JWT_SECRET=
JWT_EXPIRATION_TIME=8h
DATABASE_URL=
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_URL=
AWS_BUCKET_NAME=
```

**Note**: `.env.example` uses `JWT_SECRET` and `AWS_BUCKET_NAME` but `src/env.mjs` uses `SESSION_SECRET` and `AWS_S3_BUCKET_NAME`. The `.env.example` file is outdated/inconsistent with the actual env validation.

---

## Build Cache Usage

- ✅ `deps` stage caches `node_modules` separately from source code
- ✅ `COPY package.json pnpm-lock.yaml* ./` before `pnpm i` — cache layer invalidates only on dependency changes
- ⚠️ `builder` stage copies all source files at once (`COPY . .`) — any file change invalidates the build cache

---

## Production Optimization

- ✅ Multi-stage build (deps and dev tools not in final image)
- ✅ `output: 'standalone'` — only required files copied to runner stage
- ✅ Non-root user in production
- ✅ Alpine base (~50MB vs ~200MB for debian)
- ⚠️ `pnpm install -g` called twice (deps + builder stages) — minor inefficiency
- ⚠️ No `.dockerignore` file detected — `COPY . .` in builder stage may include unnecessary files (`.git`, `docs`, `node_modules` from local, etc.)

---

## Missing `.dockerignore`

No `.dockerignore` file detected. This means `COPY . .` in the builder stage copies:
- `.git/` directory
- `node_modules/` (if exists locally — overridden by `COPY --from=deps` but still transferred)
- `docs/`
- Any local `.env` file
- Development artifacts

**Risk**: Slower builds, potential secret exposure if `.env` file is accidentally included.

---

## Security Analysis Summary

| Issue | Severity | Details |
|---|---|---|
| Docker socket mounted in Traefik | High | Full host access if container compromised |
| No HTTPS/TLS configuration | High | All traffic in plaintext |
| Hardcoded DB credentials in compose | Medium | `lrwhpassword` visible in version control |
| Missing `.dockerignore` | Medium | Build context includes unnecessary files |
| No health checks | Low | Container restarts on crash only |
| Next.js telemetry enabled | Low | Build stats sent to Vercel |
| `pnpm` installed twice across stages | Low | Minor build time inefficiency |

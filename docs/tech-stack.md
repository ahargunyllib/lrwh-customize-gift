# Tech Stack

## Core Framework

| Technology | Version | Role |
|---|---|---|
| Next.js | 15.3.8 | Full-stack React framework (App Router) |
| React | 19.0.1 | UI library |
| React DOM | 19.0.1 | Browser rendering |
| TypeScript | 5.x | Static typing |
| Node.js | 22 (Docker) | Runtime |

## Styling

| Technology | Version | Role |
|---|---|---|
| TailwindCSS | 4.x | Utility-first CSS |
| @tailwindcss/postcss | 4.x | PostCSS integration |
| PostCSS | (via postcss.config.mjs) | CSS transformation |
| tw-animate-css | 1.2.8 | Animation utilities |
| class-variance-authority | 0.7.1 | Component variant management |
| clsx | 2.1.1 | Conditional class names |
| tailwind-merge | 3.2.0 | Merge Tailwind classes without conflicts |

## UI Component Library

| Technology | Version | Role |
|---|---|---|
| Shadcn/ui | (via components.json) | Pre-built accessible components |
| Radix UI | Various (1.x–2.x) | Headless accessible primitives |
| lucide-react | 0.503.0 | Icon library |
| next-themes | 0.4.6 | Dark/light theme switching |
| sonner | 2.0.3 | Toast notifications |
| vaul | 1.1.2 | Drawer/sheet component |
| cmdk | 1.1.1 | Command palette |
| embla-carousel-react | 8.6.0 | Carousel |
| recharts | 2.15.3 | Chart library (present, minimal usage detected) |
| react-resizable-panels | 2.1.9 | Resizable panel layout |
| input-otp | 1.4.2 | OTP input |
| react-day-picker | 8.10.1 | Date picker |

## State Management

| Technology | Version | Role |
|---|---|---|
| Zustand | 5.0.5 | Client-side state (order store, template store, first-visit store) |
| TanStack Query | 5.74.11 | Server state, caching, mutations |
| TanStack Query Devtools | 5.74.11 | Dev-only query inspector |
| nuqs | 2.6.0 | URL search param state management |

## Forms & Validation

| Technology | Version | Role |
|---|---|---|
| react-hook-form | 7.56.1 | Form state management |
| @hookform/resolvers | 5.0.1 | Schema resolver bridge |
| zod | 3.24.3 | Schema validation (used in DTOs and forms) |

## Database

| Technology | Version | Role |
|---|---|---|
| PostgreSQL | 15-alpine (Docker) | Primary database |
| pg | 8.16.3 | PostgreSQL client (node-postgres) |
| Drizzle ORM | 0.43.1 | Type-safe SQL ORM |
| Drizzle Kit | 0.31.0 | Schema push + migration tooling |
| @types/pg | 8.15.6 | Type definitions |

### Drizzle Configuration
- **Dialect**: PostgreSQL
- **Schema location**: `./src/server/db/schema`
- **Output**: `./drizzle`
- **Migration strategy**: `drizzle-kit push` (schema push, not migration files)

## Authentication & Security

| Technology | Version | Role |
|---|---|---|
| iron-session | 8.0.4 | Cookie-based encrypted session storage |
| jose | 6.0.10 | JWT signing (HS256) and decoding |
| bcrypt-ts | 7.0.0 | Password hashing (bcrypt, 10 rounds) |
| cookies-next | 5.1.0 | Cookie management on client |

## Storage

| Technology | Version | Role |
|---|---|---|
| @aws-sdk/client-s3 | 3.802.0 | AWS S3 SDK for file storage |
| S3-compatible storage | — | Files stored at `AWS_S3_URL` (not necessarily AWS) |

**Storage endpoint**: Configured via `AWS_S3_URL` (custom endpoint, region `ap-southeast-1`).
Files are uploaded with `ACL: public-read`.

## Image Processing

| Technology | Version | Role |
|---|---|---|
| html2canvas-pro | 1.5.11 | DOM-to-canvas rendering for export |
| html-to-image | 1.11.11 | Alternative DOM-to-image utility (imported but primary is html2canvas-pro) |
| Browser Canvas API | Native | Grayscale processing, text height measurement |

**No server-side image processing library** (no sharp, no Jimp, no ImageMagick).

## Fonts

| Technology | Version | Role |
|---|---|---|
| next/font/google | (Next.js built-in) | Plus Jakarta Sans, Inter |
| Custom fonts | — | 45+ fonts in /public/fonts (TTF/OTF/WOFF2) |
| @svgr/webpack | 8.1.0 | SVG import as React components |

**Custom font loading**: Loaded via `src/shared/styles/fonts.css` using `@font-face`.
Font catalogue defined in `src/shared/lib/font.ts` (~80 font families).

## Logging

| Technology | Version | Role |
|---|---|---|
| winston | 3.19.0 | Structured logging |
| winston-daily-rotate-file | 5.0.0 | Log file rotation (daily + 10MB size cap, 14-day retention) |

**Log output**:
- Console (colorized in dev, JSON in prod)
- `logs/app-YYYY-MM-DD.log` — all logs
- `logs/error-YYYY-MM-DD.log` — errors only

## Utilities

| Technology | Version | Role |
|---|---|---|
| uuid | 11.1.0 | UUID v4 generation for element IDs and template IDs |
| date-fns | 4.1.0 | Date formatting |

## Development Tools

| Technology | Version | Role |
|---|---|---|
| Biome | 1.9.4 | Linter + formatter (replaces ESLint + Prettier) |
| lint-staged | 15.5.1 | Pre-commit hook runner |
| tsx | 4.19.4 | TypeScript execution (for scripts) |
| ts-plugin-sort-import-suggestions | 1.0.4 | IDE import sorting plugin |
| pnpm | (via npm install -g pnpm in Dockerfile) | Package manager |

## Environment Variable Validation

| Technology | Version | Role |
|---|---|---|
| @t3-oss/env-nextjs | 0.13.0 | Type-safe env validation at build time |

**Validated server-side env vars**:
- `SESSION_PASSWORD` (min 32 chars)
- `SESSION_SECRET` (min 32 chars)
- `SESSION_EXPIRATION_TIME` (e.g., `8h`)
- `DATABASE_URL`
- `AWS_S3_ACCESS_KEY`
- `AWS_S3_SECRET_ACCESS_KEY`
- `AWS_S3_URL`
- `AWS_S3_BUCKET_NAME`

**Validated client-side env vars**:
- `NEXT_PUBLIC_APP_URL`

## TypeScript Configuration

```json
{
  "target": "ES2022",
  "strict": true,
  "module": "esnext",
  "moduleResolution": "bundler",
  "verbatimModuleSyntax": true,
  "isolatedModules": true,
  "jsx": "preserve",
  "incremental": true,
  "paths": { "@/*": ["./src/*"] }
}
```

Notable settings:
- `strict: true` — full strict mode enabled
- `verbatimModuleSyntax: true` — forces explicit `import type` where needed
- `@/` path alias maps to `src/`

## Infrastructure

| Technology | Version | Role |
|---|---|---|
| Docker | — | Containerization |
| Traefik | 3.6.1 | Reverse proxy, HTTP routing |
| PostgreSQL | 15-alpine | Database container |
| Docker Compose | — | Multi-service orchestration |

**Docker base image**: `node:22-alpine`
**Build**: Multi-stage (deps → builder → runner)
**Output**: `standalone` Next.js build

## Next.js Specific Configuration

```typescript
// next.config.ts
{
  output: 'standalone',                           // Optimized Docker output
  experimental: {
    serverActions: { bodySizeLimit: '100mb' }    // Large image data URL uploads
  },
  images: {
    remotePatterns: [
      { hostname: 'placecats.com' },            // Placeholder images (dev)
      { hostname: 'is3.cloudhost.id' }          // S3-compatible storage host
    ]
  },
  webpack: {
    // SVG → React component via @svgr/webpack
  }
}
```

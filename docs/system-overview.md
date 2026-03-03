# System Overview

## High-Level Architecture

LRWH Customize Gift is a **monolithic full-stack Next.js 15 application** that functions as a Photobox-like gift customization platform. There is no separate backend service — all backend logic runs inside Next.js via **Server Actions** and a single HTTP API route.

```
Browser (Client Components)
  │
  ├─── Next.js App Router (SSR/CSR hybrid)
  │       ├── Server Actions ("use server")  →  PostgreSQL (Drizzle ORM)
  │       ├── Server Actions ("use server")  →  AWS S3
  │       └── GET /api/files/[...key]        →  AWS S3 (stream proxy)
  │
  └── Static Assets → /public (fonts, SVGs, images)

Infrastructure:
  Traefik (port 80) → Next.js App (port 3000) → PostgreSQL (internal network)
```

## Frontend vs Backend Separation

There is no separate backend server. The same Next.js process handles both:

- **Frontend**: React components (client and server), TailwindCSS 4, Radix UI, Shadcn/ui
- **Backend**: Next.js Server Actions with `"use server"` directive, direct DB access via Drizzle ORM, S3 SDK calls

## Next.js Runtime

- **Runtime**: Node.js (not Edge). The Dockerfile runs `node server.js` with `output: 'standalone'`.
- **App Router**: Used exclusively. No Pages Router.
- **Server Actions**: Body size limit raised to `100mb` to accommodate base64-encoded image data URLs submitted during order completion.

## App Router Structure

```
src/app/
├── layout.tsx                          Root layout (providers, fonts, metadata)
├── error.tsx                           Error boundary
├── global-error.tsx                    Global error handler
├── not-found.tsx                       404 page
├── login/page.tsx                      Login page (public)
├── api/files/[...key]/route.ts         Single HTTP route: S3 file proxy
├── (app)/                              Route group: user-facing app
│   ├── editor/
│   │   ├── create/page.tsx             Admin: create new template
│   │   ├── [id]/page.tsx               Admin: preview/view template
│   │   └── [id]/edit/page.tsx          Admin: edit existing template
│   └── templates/
│       ├── page.tsx                    User: browse and select templates
│       ├── onboarding/page.tsx         User: enter username + order number
│       ├── layout.tsx                  Templates layout
│       └── [id]/page.tsx              User: customize template (inject photo)
└── dashboard/                          Admin dashboard
    ├── layout.tsx
    ├── profile/page.tsx
    ├── audit-log/page.tsx
    ├── product-management/page.tsx
    ├── order-management/page.tsx
    └── user-management/page.tsx
```

## Rendering Modes

| Route | Rendering Mode | Reason |
|---|---|---|
| `/login` | SSR | Server component, no client state |
| `/templates/onboarding` | SSR + CSR (Suspense) | Form with search params |
| `/templates` | CSR (`dynamic` + `ssr: false`) | Requires Zustand store (browser-only) |
| `/templates/[id]` | CSR (`dynamic` + `ssr: false`) | Canvas editor cannot run on server |
| `/editor/create` | SSR | Simple page wrapper |
| `/editor/[id]` | CSR (`dynamic` + `ssr: false`) | Canvas editor |
| `/editor/[id]/edit` | SSR | Page wrapper only |
| `/dashboard/*` | SSR | Admin pages, server-rendered |
| `/api/files/[...key]` | Node.js Route Handler | S3 stream proxy |

## API Routes

Only **one explicit HTTP API route** exists:

- `GET /api/files/[...key]` — Proxies S3 object streams to the browser. All other data operations use Next.js **Server Actions**.

## Template Rendering Pipeline

```
1. Admin opens /editor/create or /editor/[id]/edit
2. TemplateCreator container loads
3. Admin configures canvas: width/height, background, layers
4. Admin adds elements: ImageElement, TextElement, ShapeElement, LineElement
5. Admin positions, resizes, rotates elements on EditorCanvas (HTML/CSS/DOM)
6. Admin saves → createTemplate() or updateTemplate() Server Action called
7. Template JSON (TemplateData) stored in templates.data (JSONB column)
8. Preview image (PNG) optionally generated client-side and uploaded to S3
```

## How Image Processing Works

Image processing is **entirely client-side** using browser APIs:

- **Canvas API** (`document.createElement('canvas')`) — used for:
  - Grayscale effect per-pixel blending (`applyGrayscaleToImage`)
  - Text height measurement (`calculateTextHeight`)
- **html2canvas-pro** — renders the DOM canvas to a PNG data URL for order submission
- **No server-side image processing** (no sharp, no Jimp, no ImageMagick)

## Storage Flow

```
Upload Flow (Admin — Template Preview):
  Client: File selected → uploadFileToS3(file) Server Action
  Server: File → ArrayBuffer → Buffer → S3 PutObject (ACL: public-read)
  Result: Public URL stored in templates.preview_url

Upload Flow (User — Order Submission):
  Client: html2canvas-pro renders EditorCanvas → data URL (PNG, base64)
  Client: submitOrder() Server Action called with {orderId, templates[{orderProductVariantId, dataURL}]}
  Server: parseDataUrl() → validate PNG magic bytes → size check (max 8MB)
  Server: uploadBufferToS3(buffer, key) where key = "{username}_{orderNumber}_{sha256}.png"
  Server: imageUrl stored in order_product_variants.image_url
  Server: Order status updated: no-images → progress → completed

Retrieval Flow:
  GET /api/files/{bucket}/{filename} → getObjectStream() → streamed Response
```

## Request Lifecycle

```
HTTP Request
  │
  ├─ Next.js Middleware (src/middleware.ts)
  │   Runs on: /, /old, /editor/:path*, /design-system, /api/:path*, /dashboard/:path*
  │   Pipeline:
  │   1. devOnlyGuard    — block /design-system in production
  │   2. authGuard       — redirect unauthenticated users to /login
  │   3. redirectRules   — / → /templates/onboarding, /dashboard → /dashboard/profile
  │   4. roleBasedAccess — redirect admins to allowed dashboard tabs only
  │
  ├─ Next.js Server (SSR/RSC)
  │   Renders server components, runs Server Actions
  │
  └─ Browser (CSR)
      Client components hydrate, TanStack Query manages server state
```

## Template Rendering Lifecycle (User Customization)

```
1. User visits /templates/onboarding
2. User submits username + orderNumber
3. verifyOrderByUsernameAndOrderNumber() Server Action called
4. Returns order with productVariants and their template slots
5. Order stored in Zustand (useTemplatesStore)
6. User redirected to /templates?productVariantId=...
7. User sees list of templates for their product variant
8. User selects template → navigated to /templates/[templateId]?orderProductVariantId=...
9. getTemplateById() fetches template JSON from DB
10. TemplateEditor renders EditorCanvas with isCustomizing=true
11. User can only modify designated editable elements
12. User clicks submit → html2canvas-pro captures DOM canvas → PNG data URL
13. submitOrder() Server Action: validates, uploads to S3, updates DB
14. Order status transitions: no-images → progress → completed
```

## Photo Injection Lifecycle

```
Template has ImageElement[] with draggable=false for locked slots
  │
  ├─ In customizing mode (isCustomizing=true):
  │   EditorCanvas initializes with blank slate (empty images/texts/shapes/lines)
  │   OR initializes with saved initialTemplate if returning user
  │
  ├─ User drops/uploads photo onto canvas
  │   useCanvasDrop hook handles the drop event
  │   Image added as ImageElement to template.images[]
  │
  ├─ User adjusts image (imageAdjust custom event)
  │   useImageAdjust hook repositions imageOffset within fixed frame
  │
  └─ On export:
      prepareCanvasForExport() applies grayscale via canvas pixel manipulation
      html2canvas-pro captures the full DOM canvas as PNG
      Data URL sent to submitOrder() Server Action
```

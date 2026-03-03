# Folder Structure

## Root Layout

```
lrwh-customize-gift/
├── src/                    Application source code
├── public/                 Static assets (fonts, images, SVGs)
├── docs/                   This documentation
├── drizzle/                Drizzle ORM output (schema artifacts)
├── .vscode/                VSCode workspace config
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── docker-compose.yaml
├── Dockerfile
├── biome.json              Linter/formatter config
├── components.json         Shadcn/ui config
├── postcss.config.mjs
├── flake.nix               Nix development environment
├── pnpm-lock.yaml
├── CONVENTION.md           Code conventions document
└── FONTS.md                Font documentation
```

---

## `src/app/` — Next.js App Router

**Responsibility**: Route definitions and page entry points only. Pages are thin wrappers that import containers from `features/`.

**Cross-dependencies**: Imports from `features/`, `shared/components/`, `shared/repository/`.

**Risk areas**:
- `/templates/[id]/page.tsx` has business logic (order validation) directly in the page component — should be in a container.
- `/editor/[id]/page.tsx` uses `dynamic()` import with `ssr: false` to defer canvas initialization.

```
src/app/
├── layout.tsx                  Root layout: fonts, providers, metadata
├── error.tsx                   Error boundary (route-level)
├── global-error.tsx            Global error handler
├── not-found.tsx               404 page
├── login/
│   └── page.tsx                Public login page
├── api/
│   └── files/[...key]/
│       └── route.ts            GET handler: S3 stream proxy
├── (app)/                      Route group (no layout impact)
│   ├── editor/
│   │   ├── create/page.tsx     Admin: new template
│   │   ├── [id]/page.tsx       Admin: view template
│   │   └── [id]/edit/page.tsx  Admin: edit template
│   └── templates/
│       ├── page.tsx            User: template browser
│       ├── onboarding/page.tsx User: enter order credentials
│       ├── layout.tsx          Templates section layout
│       └── [id]/page.tsx       User: customize template
└── dashboard/
    ├── layout.tsx              Dashboard layout with sidebar
    ├── profile/page.tsx
    ├── audit-log/page.tsx
    ├── product-management/page.tsx
    ├── order-management/page.tsx
    └── user-management/page.tsx
```

---

## `src/features/` — Feature Modules

**Responsibility**: Self-contained feature slices. Each feature owns its components, containers, hooks, and local state. Follows a consistent internal structure.

**Cross-dependencies**: Features import from `shared/`. Features do NOT import from each other (one-way dependency rule).

**Risk areas**: Some business logic leaks into components rather than hooks/containers.

### `src/features/editor/`

The most complex feature. Contains the canvas-based template editor used by both admins (create/edit) and users (customize).

```
editor/
├── components/
│   ├── card/                   Image card, text card display components
│   ├── header/
│   │   ├── header-creator.tsx  Admin editor header bar
│   │   └── header-editor.tsx   User customization header
│   ├── mobile-editor/          Mobile-specific editing UI
│   ├── ruler/
│   │   ├── ruler-system.tsx    Ruler component with guide creation
│   │   └── guides-overlay.tsx  Visual guide lines on canvas
│   ├── sidebar/
│   │   ├── sidebar-creator.tsx Admin sidebar (all element types)
│   │   └── sidebar-editor.tsx  User sidebar (restricted)
│   ├── tabs/
│   │   ├── editor/             Text and image tabs for user editor
│   │   └── creator/            Full element tabs for admin
│   ├── template-elements/
│   │   ├── template-image.tsx  Draggable/resizable image element
│   │   ├── template-text.tsx   Draggable/resizable text element
│   │   ├── template-shape.tsx  Shape element
│   │   ├── template-line.tsx   Line element
│   │   └── allignment-guides.tsx Snapping guides overlay
│   ├── editor-canvas.tsx       Core canvas component (renders all elements)
│   ├── zoom-control.tsx        Zoom in/out/reset buttons
│   ├── text-editor.tsx         Rich text editing UI
│   ├── image-uploader.tsx      Image upload input
│   └── onboarding-form-modal.tsx
├── containers/
│   ├── template-creator.tsx    Admin editor container (full features)
│   ├── template-editor.tsx     User customization container (restricted)
│   ├── template-selector.tsx   Template selection list
│   ├── onboarding-form-modal-container.tsx
│   └── product-variant-select-container.tsx
├── hooks/
│   ├── use-template-editor.ts      Core editor state + element CRUD
│   ├── use-template-persistence.ts Load/save templates to DB
│   ├── use-canvas-drop.ts          Drag-and-drop file onto canvas
│   ├── use-canvas-gesture.ts       Pan gesture (touch/trackpad)
│   ├── use-canvas-scale.ts         Auto-scale canvas to container
│   ├── use-canvas-zoom.ts          Manual zoom controls
│   ├── use-element-center.ts       Center element event listener
│   ├── use-element-drag.ts         Drag element on canvas
│   ├── use-element-move.ts         Custom event handler for element move
│   ├── use-element-transform.ts    Combined transform (drag + resize)
│   ├── use-adjust-image.ts         Image offset adjustment (pan within frame)
│   ├── use-image-replace.ts        Replace image src
│   ├── use-resize-image.ts         8-direction image resize
│   ├── use-resize-text.ts          Text box resize
│   ├── use-auto-text-height.ts     Auto-grow text height
│   ├── use-allignment-guides.ts    Snapping alignment guides
│   ├── use-keyboard-delete.ts      Delete/Backspace key element deletion
│   ├── use-line-transform.ts       Line endpoint drag
│   ├── use-ruler-guides.ts         Ruler guide management
│   ├── use-background-canvas.tsx   Background image/color controls
│   └── use-onboarding-form.ts      Onboarding form logic (also in templates feature)
├── services/
│   └── index.ts                    Legacy localStorage template lookup (dead code)
└── utils/
    └── line-config.ts              Default configs for line variants
```

### `src/features/templates/`

User-facing template browsing and order submission flow.

```
templates/
├── components/
│   ├── list-templates.tsx              Available template list
│   ├── list-filled-templates.tsx       Completed templates with preview
│   ├── onboarding-form.tsx             Username + order number form
│   ├── header.tsx                      Page header
│   ├── background.tsx                  Decorative background
│   ├── help-card.tsx                   Instructions sidebar card
│   ├── first-visit-dialog.tsx          First-visit welcome modal
│   ├── send-dialog.tsx / send-sheet.tsx       Submission confirmation (desktop/mobile)
│   ├── send-dialog-button.tsx / send-sheet-button.tsx
│   ├── delete-warning-dialog.tsx / delete-warning-sheet.tsx
│   ├── order-completed-dialog.tsx / order-completed-sheet.tsx
│   └── order-incomplete-dialog.tsx / order-incomplete-sheet.tsx
├── containers/
│   └── main-container.tsx             Main template selection page logic
├── hooks/
│   └── use-onboarding-form.ts         Onboarding form submission hook
└── stores/
    ├── use-templates-store.ts          Zustand: order + productVariants state
    └── use-first-visit-store.ts        Zustand: persisted first-visit flag
```

### `src/features/dashboard/`

Admin dashboard shell (sidebar + navbar).

```
dashboard/
├── components/
│   ├── app-sidebar.tsx     Sidebar with role-filtered navigation
│   └── navbar.tsx          Top navigation bar
└── data/
    └── tabs.ts             Role → allowed tab mappings (used in roleBasedAccess middleware)
```

### `src/features/auth/`

Login UI.

```
auth/
├── components/
│   └── login-form.tsx
└── hooks/
    └── use-login-form.tsx
```

### `src/features/profile/`

Admin profile management.

```
profile/
├── components/
│   ├── profile-form.tsx
│   └── password-form.tsx
└── containers/
    └── profile-container.tsx
```

### `src/features/product-management/`

Admin product and variant CRUD.

```
product-management/
├── components/
│   └── (forms for create/edit product and variant)
└── containers/
    └── products-table-container.tsx
```

### `src/features/order-management/`

Admin order CRUD and status management.

```
order-management/
├── components/
│   └── (order table, forms)
├── container/
│   └── orders-table-container.tsx
└── hooks/
    └── (order-specific hooks)
```

### `src/features/audit-log/`

Admin audit log viewer (read-only).

```
audit-log/
├── components/
└── containers/
```

### `src/features/user-management/`

Admin user (admin account) management.

```
user-management/
├── components/
└── containers/
```

---

## `src/shared/` — Shared Utilities & Components

**Responsibility**: Cross-feature reusable code. Divided into clear sub-directories by type.

**Cross-dependencies**: `shared/` does NOT import from `features/`. It is the dependency leaf layer.

**Risk areas**: `shared/repository/` contains all data access and Server Actions — it is imported by both `features/` and `app/`.

### `src/shared/components/`

```
shared/components/
├── ui/                         50+ Shadcn/ui components (accordion, button, dialog, etc.)
├── providers/
│   ├── index.tsx               Root provider composition
│   ├── nuqs-provider.tsx       URL state provider
│   ├── react-query-provider.tsx TanStack Query client provider
│   └── theme-provider.tsx      next-themes provider
├── shape-lines/
│   ├── configurator/           ShapeConfigurator and LineConfigurator controls
│   ├── controls/               Individual control widgets (color, size, opacity, etc.)
│   └── selector/               ShapeSelector, LineSelector pickers
├── data-table-pagination.tsx   Reusable pagination component
└── fullscreen-loader.tsx       Full-screen loading overlay
```

### `src/shared/hooks/`

```
shared/hooks/
├── use-debounce.ts             Debounce hook
├── use-dialog.tsx              Global dialog state (Zustand-backed)
├── use-mobile.ts               Responsive mobile detection
├── use-pagination.ts           Pagination URL params helper
├── use-scroll-to-active.ts     Auto-scroll to active item
├── use-sheet.tsx               Global sheet/drawer state
└── use-url-param-update.ts     Update URL search params
```

### `src/shared/lib/`

```
shared/lib/
├── utils.ts            cn() utility (clsx + tailwind-merge)
├── try-catch.ts        Async error wrapper returning {data, error}
├── session.ts          Iron session config + SessionData type
├── enums.ts            roleEnum: {1: "admin", 2: "superadmin"}
├── decode.ts           JWT encode/decode via jose
├── data-url.ts         Data URL parsing, PNG validation, SHA256 hash
├── elements.ts         validateTextElement, calculateTextHeight, applyGrayscaleToImage, prepareCanvasForExport
├── template.ts         getTemplateForSize, scaleTemplate (coordinate scaling)
├── font.ts             fontFamily map (~80 fonts) + fontArray
├── fonts.ts            next/font/google: Plus Jakarta Sans, Inter
├── events.ts           triggerElementCenter() custom event dispatcher
└── logger.ts           Winston logger with daily rotation
```

### `src/shared/repository/`

**Responsibility**: All data access. Server Actions (`action.ts`) + TanStack Query hooks (`query.ts`) + DTO types (`dto.ts`).

**Pattern**: `action.ts` = `"use server"` file; `query.ts` = `"use client"` file wrapping actions in React Query.

```
shared/repository/
├── auth/                   Login, logout actions + mutations
├── admin/                  Admin user CRUD
├── user/                   Profile update, password change
├── templates/              Template CRUD
├── product/                Product + variant CRUD
├── order/                  Order CRUD + verify + submit
├── audit-log/              Audit log read + create
└── session-manager/        Iron session create/destroy/get
```

### `src/shared/types/`

```
shared/types/
├── index.ts            Re-exports all types
├── api.ts              ApiResponse<T> discriminated union
├── template.ts         TemplateData, ImageElement, TextElement, CropArea, TemplateEntity
├── element/
│   ├── index.ts        ActiveElement type
│   ├── line.ts         LineElement, TLineElement, LineTip, LINE_TIP
│   └── shape.ts        ShapeElement, TShapeElement
├── order.ts            Order, OrderProductVariant
├── product.ts          Product, ProductVariant
├── audit-log.ts        AuditLog
├── pagination.ts       Pagination
└── middleware.ts       MiddlewareContext, MiddlewareFunction
```

### `src/shared/styles/`

```
shared/styles/
├── globals.css     Global CSS resets and Tailwind base
└── fonts.css       @font-face declarations for 45+ custom fonts
```

---

## `src/server/` — Backend Infrastructure

**Responsibility**: Database connection and S3 client. No business logic — business logic lives in `shared/repository/`.

```
server/
├── db/
│   ├── index.ts            Drizzle + node-postgres Pool connection
│   └── schema/
│       ├── users.ts
│       ├── products.ts
│       ├── templates.ts
│       ├── orders.ts
│       └── audit-logs.ts
└── s3/
    └── index.ts            S3Client + uploadFileToS3 + uploadBufferToS3 + getObjectStream
```

---

## `src/middlewares/` — Middleware Guards

**Responsibility**: Route protection logic. Composed as a pipeline in `src/middleware.ts`.

```
middlewares/
├── constant.ts             PROTECTED_ROUTES, DEV_ONLY_ROUTES, ROUTE_REDIRECTS
├── auth-guard.ts           Redirect unauthenticated users to /login
├── role-access-guard.ts    Restrict dashboard routes by role
├── redirect-rules-guard.ts Static redirect rules (/ → /templates/onboarding)
└── dev-only-guard.ts       Block /design-system in production
```

---

## `public/` — Static Assets

```
public/
├── fonts/          45+ font files (TTF, OTF, WOFF2)
├── imgs/           Product and tip images
├── svgs/           Decorative SVG vector files (vector-1.svg through vector-6.svg)
├── placeholder.png Default image placeholder
└── icon.jpeg       App icon (favicon + OG image)
```

---

## Cross-Dependency Map

```
app/         → features/, shared/components/, shared/repository/
features/    → shared/components/, shared/repository/, shared/lib/, shared/types/
shared/      → server/db/, server/s3/, env.mjs
server/      → env.mjs
middlewares/ → shared/repository/session-manager/, shared/types/, features/dashboard/data/
```

**Violations detected**:
- `middlewares/role-access-guard.ts` imports from `features/dashboard/data/tabs.ts` — middleware depends on a feature module, creating tight coupling.

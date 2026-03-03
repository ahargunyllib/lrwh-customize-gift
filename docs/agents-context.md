# Agent Context — AI-Ready System Guide

This document is optimized for AI agents working on this codebase. It provides a complete mental model, identifies safe extension points, highlights fragile areas, and documents critical invariants.

---

## System in One Paragraph

LRWH Customize Gift is a **Next.js 15 full-stack monolith** where admins create visual templates (using an HTML/CSS canvas editor) and users inject their photos into those templates to customize gift products. The core data flow is: Admin creates template JSON → stored in PostgreSQL → User verifies order → selects template → edits it in browser → html2canvas-pro captures DOM → PNG uploaded to S3 → order status updated. There are no separate backend services. All DB access and S3 operations happen via Next.js Server Actions. The frontend is React 19 with Zustand for client state and TanStack Query for server state.

---

## Critical Invariants

These must never be violated or the system breaks:

### 1. Template ID is client-generated UUID

```typescript
// use-template-editor.ts:
id: uuidv4()  // generated in browser

// createTemplate server action — uses req.id directly:
sql`insert into templates (id, ...) values (${req.id}, ...)`
```

The template `id` flows from client to server. If you change this to a server-generated ID, you must also update the redirect after save and the initial state in `useTemplateEditor`.

### 2. `template.layer` array is the source of truth for z-index

```typescript
// getLayerIndex(id) returns the index in template.layer
// This index is passed as CSS z-index to every element
```

When adding new element types, always append the new element ID to `template.layer`. If an element's ID is not in `layer`, it renders at z-index 0 (behind everything).

When deleting elements, always remove from both the typed array (`template.images` etc.) AND from `template.layer`. The `deleteElement()` function in `useTemplateEditor` only removes from typed arrays — `layer` cleanup is NOT implemented there.

**Bug**: Deleting an element leaves a stale ID in `template.layer[]`. This is a current bug.

### 3. Template data is stored as JSON, not JSONB

The `templates.data` column is `JSON` type (not `JSONB`). This means:
- No JSON-level indexing
- Cannot query into the JSON with PostgreSQL JSON operators via Drizzle
- Any query that needs to filter by element content must fetch all templates and filter in code

### 4. `orderProductVariants.imageUrl` is write-once

Once `imageUrl` is set, `submitOrder()` rejects further writes with "Image already submitted". This is enforced in the Server Action, not in the database (no DB-level unique constraint or trigger). If you bypass the Server Action, you can overwrite.

### 5. Session cookie requires HTTPS

`session-cookie` has `secure: true` always. The app will not authenticate users over HTTP. This is a hardcoded invariant in `src/shared/lib/session.ts`.

### 6. `isCustomizing` flag controls what users can do

In `EditorCanvas`, `isCustomizing=true` restricts the canvas to only allow new image drops (via `useCanvasDrop`). The admin editor also sets `isCustomizing=true` in `TemplateCreator`. The distinction between admin editor and user customization is controlled by which container is used (`TemplateCreator` vs `TemplateEditor`) and which sidebar is shown.

### 7. Server Action body limit is 100MB

```typescript
// next.config.ts:
serverActions: { bodySizeLimit: '100mb' }
```

This exists because `submitOrder` receives base64 PNG data URLs (~8MB decoded = ~11MB base64 each). Do not reduce this limit without also reducing the max image size in `submitOrder`.

---

## Safe Extension Points

### Adding a New Element Type

1. Define the TypeScript type in `src/shared/types/element/` (follow `shape.ts` or `line.ts` pattern)
2. Add the element array to `TemplateData` in `src/shared/types/template.ts`
3. Add to the `data` object in `createTemplate`/`updateTemplate` server actions
4. Add `add{Type}()` and `update{Type}()` methods to `useTemplateEditor`
5. Create a `Template{Type}.tsx` component in `src/features/editor/components/template-elements/`
6. Add rendering in `EditorCanvas.tsx` (map over the array, pass `layerIndex`)
7. Add to the `deleteElement()` logic in `useTemplateEditor`
8. Add to the `layer` cleanup when deleting
9. Add controls to the creator/editor sidebars

### Adding a New Admin Dashboard Page

1. Create `src/app/dashboard/your-page/page.tsx`
2. Create feature module at `src/features/your-feature/`
3. Add Server Actions in `src/shared/repository/your-feature/action.ts`
4. Add TanStack Query hooks in `src/shared/repository/your-feature/query.ts`
5. Add the route to allowed tabs in `src/features/dashboard/data/tabs.ts` for the appropriate role
6. The middleware (`roleBasedAccess`) will automatically protect it

### Adding a New User-Facing Page

1. Create route in `src/app/(app)/your-route/`
2. If auth-required: add to `PROTECTED_ROUTES` in `src/middlewares/constant.ts`
3. Access user order data from Zustand `useTemplatesStore`

### Adding a New Order Status

1. Add new status string to `orders.status` values
2. Update the status calculation logic in `submitOrder()` server action
3. Update `GetOrdersQuery.status` type in `order/dto.ts`
4. Update the order management UI to display/filter the new status

---

## Fragile Parts

### `EditorCanvas` — High Complexity, Low Test Coverage

`EditorCanvas` coordinates 10+ hooks via a complex event-driven system. Changes to element drag/resize/snap behavior require understanding:
- Custom DOM events (`elementMove`, `elementCenter`, `imageAdjust`)
- `useAlignmentGuides` snap logic
- Scale factor propagation to all child components
- `forwardRef` for html2canvas capture

**Do not refactor `EditorCanvas` without thorough manual testing of all interactions.**

### `submitOrder` — Multi-Step with No Rollback on S3 Failure

```typescript
// In submitOrder():
// 1. Validate all templates (pure)
// 2. Upload to S3 in parallel   ← if partial failure, some files uploaded but not tracked
// 3. DB transaction              ← if this fails after S3 uploads, S3 is polluted
```

If the DB transaction fails after S3 uploads succeed, the uploaded PNG files remain in S3 with no DB record. There is no cleanup or retry mechanism. **Do not add more S3 uploads to this function without also implementing rollback.**

### `useTemplatePersistence` — Implicit Create vs Update Logic

```typescript
if (!res.success)
  createTemplate(tpl, ...)  // create if getTemplateById returned failure
else
  updateTemplate(tpl, ...)  // update if getTemplateById succeeded
```

The persistence hook decides create vs update based on whether `getTemplateById` succeeds. This is fragile — a temporary DB error during load would cause a create instead of an update, creating a duplicate template.

### `useTemplateEditor` — Layer Array Not Synchronized on Delete

`deleteElement(id)` removes the element from its typed array but does NOT remove from `template.layer[]`. This means stale IDs accumulate in the layer array. Currently harmless because `getLayerIndex` returns 0 for unknown IDs, but it's a bug that could cause issues if layer-based operations iterate over all layer IDs.

### Font Loading Before Export

html2canvas captures the DOM as-is. Custom fonts must be loaded. No explicit font-loading wait. If a user initiates export before fonts finish loading, text will render incorrectly. Adding `document.fonts.ready` before capturing is a safe improvement.

### Middleware Coupling to Feature

`src/middlewares/role-access-guard.ts` imports `tabsData` from `src/features/dashboard/data/tabs.ts`. Changes to that data structure affect middleware behavior. When modifying `tabs.ts`, always verify middleware still correctly restricts routes.

---

## How to Safely Modify the Template Engine

### Adding a New Element Property

1. Add to the TypeScript interface in `src/shared/types/template.ts`
2. The property will flow through: DB storage (JSON column accepts any shape) → hydration in `getTemplates`/`getTemplateById` → rendering component
3. Handle the case where old templates don't have the new property (use optional `?` and provide defaults)
4. No DB migration needed (schemaless JSON column)

### Modifying Element Positioning

Element positions are stored as `{x: number, y: number}` in natural pixel space. Scale is applied at render time. To modify positioning:
- Positions set in drag/resize hooks → `setTemplate` updates → `EditorCanvas` reads from state → applies `* scale` in render
- Do NOT store scaled values in state — always store natural pixel values

### Modifying the Layer System

The layer array controls z-index. If you need to add a new layer concept (e.g., locked layers, group layers):
1. Understand that `template.layer` is a flat ordered array of element IDs
2. Any restructuring must be backward-compatible with existing templates in DB
3. `getLayerIndex()` is called for every render — keep it O(n) or better

### Modifying Export

The export pipeline is:
```
prepareCanvasForExport() → html2canvas() → canvas.toDataURL() → submitOrder()
```

To change export format (e.g., JPEG):
1. Change `canvas.toDataURL("image/jpeg", quality)`
2. Update MIME validation in `submitOrder()` (currently requires PNG)
3. Update `Content-Type` in the S3 upload

To change canvas capture library:
1. Both `html2canvas-pro` and `html-to-image` are installed
2. `html-to-image` would require adapting `prepareCanvasForExport` (grayscale preprocessing)
3. Test with custom fonts and CSS transforms

---

## How to Safely Modify Rendering

### Template Preview Generation

Currently admin must manually trigger preview generation (Unknown from codebase — no explicit preview-capture button was seen in repository scan; preview file is passed via `TemplateData.previewFile`). To automate:
- Capture canvas in editor before save → convert to File → set as `template.previewFile`
- The server action already handles upload if `previewFile` is provided

### Adding SSR Template Preview

Currently all rendering is client-side. To add server-side preview generation (for thumbnail images):
- Would require a server-side rendering solution (Puppeteer, Playwright, or satori)
- No sharp or canvas library is currently installed on the server
- The template JSON would need to be interpreted server-side

---

## Hidden Coupling

### 1. `PROTECTED_ROUTES` and Middleware Matcher Must Stay in Sync

```typescript
// middleware.ts config.matcher:
matcher: ['/', '/old', '/editor/:path*', '/design-system', '/api/:path*', '/dashboard/:path*']

// middlewares/constant.ts PROTECTED_ROUTES:
{ path: /^\/dashboard/ }
{ path: /^\/editor\/[^\/]+\/edit$/ }
// etc.
```

Adding a new protected route requires updating BOTH `config.matcher` (for the middleware to run) AND `PROTECTED_ROUTES` (for `authGuard` to enforce auth). Missing either breaks protection.

### 2. `useTemplatesStore` and `/templates/[id]` Validation

The template selection page (`/templates/[id]`) validates access by checking if `orderProductVariantId` exists in the Zustand store. If the store is cleared (page refresh), the user is redirected away. This means:
- Deep links to `/templates/[id]` don't work without the store being populated first
- Users who refresh the browser mid-customization are kicked out
- The store is not persisted to localStorage (session-only)

### 3. `submitOrder` Assumes PNG

The `submitOrder` validation hardcodes PNG expectation:

```typescript
if (mime !== "image/png" || !looksLikePng(buf)) {
  return { success: false, error: "Expected PNG format" }
}
```

The `html2canvas-pro` export also defaults to PNG. If you change the export format, you must change the validation in `submitOrder`.

### 4. S3 Key Format Carries Business Logic

```typescript
const key = `${orderExists[0].username}_${orderExists[0].orderNumber}_${hash}.png`
```

The S3 key encodes username + orderNumber + content hash. This key format is used for:
- Deduplication (same content → same key → same URL)
- Human readability in S3 bucket

Changing the key format would not break existing records (imageUrl is stored in DB), but new uploads would use a different format.

### 5. `tabsData` Drives Both UI and Authorization

`src/features/dashboard/data/tabs.ts` is used by:
- `AppSidebar` — to render navigation items
- `roleBasedAccess` middleware — to enforce URL access

Changes to tab structure affect both rendering and security. Adding a tab enables both UI display AND URL access automatically.

---

## Assumptions Found in Code

1. **S3 bucket is public** — All uploaded files use `ACL: "public-read"`. If the S3 bucket is private, the image URLs will return 403 and previews/orders won't display.

2. **1 cm = 40 pixels** — `changePrintSize` uses `width * 40` as pixel conversion. No documentation for this ratio.

3. **PNG output from html2canvas** — `submitOrder` hardcodes PNG validation. The assumption is that `html2canvas.toDataURL()` always produces PNG.

4. **Single region** — S3 is hardcoded to `ap-southeast-1`. Assumed to be correct for the deployment environment.

5. **Admin only auth** — The application assumes only admins log in. Regular customers (users placing orders) authenticate only via username + order number (no account/password). There is no user registration flow.

6. **Orders pre-created by admin** — Orders are created by admins, not by customers. Customers only "verify" an existing order by username + order number. There is no self-serve order creation for customers.

7. **One template per order product variant slot** — Each `OrderProductVariant` row maps to exactly one template. The user selects one template from the available list for that product variant.

---

## Where to Add New Features

| Feature | Location | Notes |
|---|---|---|
| New element type (sticker, QR code) | `src/features/editor/` + types + canvas | Follow shape/line pattern |
| New admin dashboard section | `src/features/[name]/` + `src/app/dashboard/[name]/` | Add to tabs.ts |
| Customer order tracking page | `src/app/(app)/orders/` | New public route |
| Order notification (email) | `src/shared/repository/order/action.ts` → `createOrder` | Add email service call |
| Template categories/tags | Add column to `templates` table + update types | DB migration needed |
| User comments on templates | New table + repository | DB migration needed |
| Analytics/reporting | New dashboard page + queries | Aggregate from audit_logs or new table |
| Webhook on order completion | `submitOrder` action after status = "completed" | HTTP call to external service |

---

## Quick Reference: Key Files

| Purpose | File |
|---|---|
| Core template type | `src/shared/types/template.ts` |
| Canvas component | `src/features/editor/components/editor-canvas.tsx` |
| Editor state management | `src/features/editor/hooks/use-template-editor.ts` |
| Template CRUD actions | `src/shared/repository/templates/action.ts` |
| Order submission | `src/shared/repository/order/action.ts` → `submitOrder()` |
| Auth login | `src/shared/repository/auth/action.ts` → `login()` |
| Session management | `src/shared/repository/session-manager/action.ts` |
| Middleware pipeline | `src/middleware.ts` |
| Route protection config | `src/middlewares/constant.ts` |
| DB connection | `src/server/db/index.ts` |
| S3 client | `src/server/s3/index.ts` |
| Env validation | `src/env.mjs` |
| Role enum | `src/shared/lib/enums.ts` |
| Template scaling | `src/shared/lib/template.ts` |
| Export preprocessing | `src/shared/lib/elements.ts` → `prepareCanvasForExport()` |

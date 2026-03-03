# Technical Debt

## Commented-Out Code

### Print Size Feature (Disabled)

**File**: `src/shared/types/template.ts`, `src/shared/lib/template.ts`, `src/features/editor/hooks/use-template-editor.ts`

```typescript
// src/shared/types/template.ts:
// export type PrintSize = "10x20" | "15x20" | "20x30"
// export interface PrintSizeConfig { ... }

// src/shared/lib/template.ts:
// export const printSizes: PrintSizeConfig[] = [...]

// use-template-editor.ts:
// changePrintSize: calls scaleTemplate but is effectively a no-op
const changePrintSize = (width: number, height: number) => {
  scaleTemplate(template, width * 40, height * 40)  // return value discarded!
}
```

The print size scaling feature is partially implemented but commented out and the live implementation has a bug — `scaleTemplate()` returns a new template but `changePrintSize()` discards the return value without calling `setTemplate()`.

---

### LocalStorage Template Persistence (Replaced)

**File**: `src/features/editor/hooks/use-template-persistence.ts`, `src/features/editor/services/index.ts`

```typescript
// Commented out in use-template-persistence.ts:
// const stored: TemplateData[] = JSON.parse(
//   localStorage.getItem("customTemplates") || "[]"
// )
// ...localStorage.setItem("customTemplates", JSON.stringify(stored))
```

The entire `src/features/editor/services/index.ts` is dead code — it reads from localStorage which is no longer used:

```typescript
// services/index.ts — DEAD CODE:
const getTemplateById = (id: string) => {
  const templates = JSON.parse(localStorage.getItem("customTemplates") || "[]")
  // ...
}
export { getTemplateById }
```

This file is never imported anywhere in the codebase (localStorage replaced by DB).

---

### Old Page (`/old`)

**File**: `src/app/(app)/old/page.tsx`

A route `/old` exists and is protected by middleware (listed in `PROTECTED_ROUTES`). This appears to be a legacy page kept for unknown reasons. The middleware matcher includes `/old`.

---

### Commented-Out Tabs State

**File**: `src/features/templates/containers/main-container.tsx`

```typescript
// const [selectedProductVariant, setSelectedProductVariant] = useState(...)
// onValueChange={(value) => {
//   setSelectedProductVariant(...)
// }}
```

The tab switching for product variants was converted from local state to URL params (via `searchParams`), but the old code remains commented out.

---

## Dead Code

### `src/features/editor/services/index.ts`

Entire file is dead code (localStorage-based template lookup, no imports found).

### `sanitize()` in `logger.ts`

```typescript
// src/shared/lib/logger.ts:
export function sanitize<T extends Record<string, unknown>>(
  data: T,
  keysToRedact: string[] = ["password", "token", "secret", "apiKey"],
): T { ... }
```

Defined but never called in any log operation.

### `changePrintSize()` in `useTemplateEditor`

Return value discarded, feature disabled. Dead function.

### `bringForward` / `sendBackward` / `bringToFront` / `sendToBack` (array-based)

`useTemplateEditor` has two separate layer management systems:
1. `layer[]` array system (current): `bringForwardLayer`, `sendBackwardLayer`, etc.
2. Array-index system (legacy): `bringForward`, `sendBackward`, `bringToFront`, `sendToBack`

Both are exported from `useTemplateEditor`, but only the `layer[]` system is used for rendering (via `getLayerIndex`). The array-index functions manipulate the `images` + `texts` arrays directly, which is inconsistent with the layer-based approach.

---

## Hardcoded Values

### Canvas Scale Calculation

```typescript
// use-template-editor.ts:
changePrintSize: scaleTemplate(template, width * 40, height * 40)
// Assumes 1cm = 40px — not documented or configurable
```

### S3 Region

```typescript
// server/s3/index.ts:
region: "ap-southeast-1",  // Hardcoded, not configurable via env
```

### S3 Bucket URL Construction

```typescript
const fileUrl = new URL(`${env.AWS_S3_BUCKET_NAME}/${file.name}`, env.AWS_S3_URL).toString()
```

This constructs the URL by concatenating bucket name + filename. If the S3 provider uses a different URL structure, this will produce incorrect URLs.

### Default Pool Size

`pg.Pool` uses default 10 connections — not tunable via environment variable.

### Max Bytes

```typescript
// lib/data-url.ts:
export const MAX_BYTES = 8 * 1024 * 1024  // 8MB — not configurable
```

### Image Dimensions in `addImage()`

```typescript
// use-template-editor.ts:
width: 200, height: 200  // default new image size
```

---

## Duplicate Logic

### Two Image Capture Libraries

Both `html2canvas-pro` and `html-to-image` are installed. Only `html2canvas-pro` is used in the submission flow. `html-to-image` is listed as a dependency at version `1.11.11` but its usage in the active export path is unclear.

### Two Layer Management Systems

As described above — `layer[]` array and array-index ordering coexist in `useTemplateEditor`.

### `use-onboarding-form.ts` Appears Twice

- `src/features/editor/hooks/use-onboarding-form.ts`
- `src/features/templates/hooks/use-onboarding-form.ts`

These may have different implementations or one may be stale.

---

## TODO / FIXME Comments

### `biome-ignore` Comments

Multiple `biome-ignore` comments found in the codebase indicating known issues the team deferred:

```typescript
// editor-canvas.tsx:
// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
useEffect(() => { ... }, [initialTemplate, isCustomizing])

// editor-canvas.tsx:
// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
<div onClick={() => setActiveElement(null)} ... >
```

**Missing explanations**: Several `biome-ignore` suppressions have `<explanation>` placeholder text rather than actual explanations.

---

## Tight Coupling Areas

### Middleware ↔ Feature

`src/middlewares/role-access-guard.ts` imports from `src/features/dashboard/data/tabs.ts`:

```typescript
import { tabsData } from "@/features/dashboard/data/tabs"
```

Middleware should not import from feature modules. This creates a circular dependency risk and means middleware behavior changes when feature code changes.

### Template Submission Flow

The `submitOrder` function has complex inline orchestration:
1. Validate each template
2. Upload in parallel
3. DB transaction

This logic is entirely within a single 150+ line function with no factored utilities. Any change to the submission flow requires modifying this large function.

---

## Unused Types / Imports

### `CropArea` type

```typescript
// src/shared/types/template.ts:
export interface CropArea {
  x: number; y: number; width: number; height: number
}
```

Defined but not used anywhere in the codebase.

### `Position` type

```typescript
// src/shared/types/template.ts:
export interface Position { x: number; y: number }
```

Used correctly.

---

## Accessibility Gaps (Code Quality)

Multiple `biome-ignore lint/a11y/*` suppressions for keyboard event handlers on `div` and `onClick` without `onKeyDown`. Non-accessible interactive elements exist in the canvas editor.

---

## Inconsistency: Raw SQL vs ORM for Templates

Template CRUD uses raw SQL `sql\`...\`` while all other entities use Drizzle's query builder:

```typescript
// templates/action.ts — raw SQL:
const queryBuilder = sql`
  insert into templates (id, name, product_variant_id, preview_url, data)
  values (${req.id}, ${req.name}, ${req.productVariantId}, ${previewUrl}, ${data})
`

// products/action.ts — Drizzle query builder:
db.insert(productsTable).values({ name: data.name, ... })
```

This inconsistency may be due to difficulty serializing JSON with Drizzle's type system. The raw SQL approach bypasses Drizzle type safety for the template's `data` column.

---

## Missing Error Boundaries

No `<ErrorBoundary>` components wrapping the editor canvas or template components. `src/app/error.tsx` exists at route level, but component-level error boundaries for the canvas are absent. A runtime error in `EditorCanvas` would propagate to the route error boundary, resetting the entire page state.

---

## Anti-Patterns

### Business Logic in Page Component

`src/app/(app)/templates/[id]/page.tsx` contains business logic (order validation, navigation guards) that belongs in a container component:

```typescript
// In page.tsx — should be in a container:
const isOrderProductVariantValid = useMemo(() => {
  return productVariants.some((pv) =>
    pv?.templates?.some((t) => t?.id === orderProductVariantId)
  )
}, [...])

useEffect(() => {
  if (!id || !orderProductVariantId || !isOrderProductVariantValid) {
    router.back()
  }
}, [...])
```

### Incomplete Type Safety

`src/shared/lib/enums.ts` has role 1 and 2 but the PROTECTED_ROUTES in `constant.ts` has `roles: ["admin", "superadmin"]` as string arrays that are never actually checked (the `roles` property is defined on route objects but not read by any middleware).

### `getSession()` Returns JSON.parse(JSON.stringify(session))

```typescript
export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await _getSession()
  return JSON.parse(JSON.stringify(session))  // type claim is wrong
}
```

Returns `any` cast as `IronSession<SessionData>` via JSON roundtrip. The returned object is not actually an `IronSession` instance (no `.save()` method, etc.) but it's typed as one. Other code relying on `session.save()` would break if called on this return value.

---

## Summary

| Category | Count | Severity |
|---|---|---|
| Dead code files/functions | 3+ | Medium |
| Disabled features (commented out) | 2 | Low |
| Hardcoded values | 6+ | Medium |
| Duplicate logic/libraries | 3 | Low |
| Missing error boundaries | 1+ | Medium |
| Tight coupling | 2 | Medium |
| Inconsistent patterns (SQL vs ORM) | 1 | Low |
| Accessibility suppressions | 2+ | Low |

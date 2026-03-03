# Risks: Technical Debt

Dead code, disabled features, hardcoded values, and structural inconsistencies.
**Related**: → `risks/fragile.md` (bugs) · → `risks/security.md` (security issues)

---

## Dead Code

### `src/features/editor/services/index.ts` — Entire file is dead

```typescript
// Reads from localStorage — localStorage template storage was replaced by DB
const getTemplateById = (id: string) => {
  const templates = JSON.parse(localStorage.getItem("customTemplates") || "[]")
  // ...
}
export { getTemplateById }
```

No imports of this file found anywhere. The localStorage template system was removed when DB persistence was added.

### `html-to-image@1.11.11` — Dead dependency

Installed as a dependency. Not used in the active export path (which uses `html2canvas-pro`). Two image capture libraries in the bundle.

### `sanitize()` in `src/shared/lib/logger.ts` — Dead utility

```typescript
export function sanitize<T extends Record<string, unknown>>(
  data: T,
  keysToRedact: string[] = ["password", "token", "secret", "apiKey"],
): T { ... }
```

Defined but never called. Log operations do not sanitize sensitive fields before writing.

---

## Disabled Features

### Print Size Scaling — Partially Implemented, Non-Functional

```typescript
// src/shared/types/template.ts (commented out):
// export type PrintSize = "10x20" | "15x20" | "20x30"

// src/features/editor/hooks/use-template-editor.ts (bug):
const changePrintSize = (width: number, height: number) => {
  scaleTemplate(template, width * 40, height * 40)   // return value discarded!
}
// setTemplate never called — function has no effect
```

`scaleTemplate()` returns a scaled template but `changePrintSize()` discards the return value. Even if the feature were re-enabled via UI, it would not work.

Also: `1 cm = 40 pixels` ratio is hardcoded with no documentation.

### Legacy Layer Functions — Superseded, Still Exported

```typescript
// use-template-editor.ts — these manipulate getAllElements() sort order, not layer[]:
bringForward(id)
sendBackward(id)
bringToFront(id)
sendToBack(id)
```

These existed before the `layer[]` z-index system. They no longer affect rendering (which reads from `layer[]`). Both sets are exported; only the `*Layer()` variants work.

---

## Hardcoded Values

| Value | Location | Should Be |
|---|---|---|
| `"ap-southeast-1"` | `server/s3/index.ts` | `env.AWS_S3_REGION` |
| `8 * 1024 * 1024` (8MB max) | `lib/data-url.ts` | `env.MAX_IMAGE_BYTES` or constant with documentation |
| `width * 40` (cm → px ratio) | `use-template-editor.ts` | Documented constant |
| `200, 200` (default new image size) | `use-template-editor.ts` | Documented constant |
| `10 (bcrypt rounds)` | `auth/action.ts` | Acceptable; document intent |
| `lrwhpassword` | `docker-compose.yaml` | Env variable reference |
| `"image/png"` | `server/s3/index.ts` · `api/files/route.ts` | Configurable |

---

## Structural Inconsistencies

### Raw SQL vs Drizzle ORM for Templates

Templates use raw SQL; all other entities use Drizzle query builder. → `infra/database.md`

This means:
- Templates miss Drizzle's compile-time type safety for queries
- Any schema change to `templates` table requires manually updating raw SQL strings
- Template queries cannot use Drizzle's relation system (`.with()`, `.findMany()`)

### Duplicate `use-onboarding-form.ts`

Both files appear to exist:
- `src/features/editor/hooks/use-onboarding-form.ts`
- `src/features/templates/hooks/use-onboarding-form.ts`

One may be stale or they may have diverged. Content parity unknown without reading both.

### `zIndex` Field on Elements is Legacy

Every element type (`ImageElement`, `TextElement`, etc.) has a `zIndex` field. This field is:
- Stored in DB (part of the JSON blob)
- Never used for rendering (rendering uses `getLayerIndex(id)` from `layer[]`)
- Updated in some `updateElement` calls (maintaining a stale value)

Adding a new element type should NOT include `zIndex` in its persistent state. → `engine/layers.md`

---

## Biome Suppressions with Placeholder Explanations

Multiple `biome-ignore` comments with `<explanation>` placeholder (not filled in):

```typescript
// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
```

These suppress real lint warnings (exhaustive deps → potential stale closure bugs; missing key events → accessibility issues) without documenting why the suppression is justified.

---

## Missing Error Boundaries

No `<ErrorBoundary>` component wraps `EditorCanvas` or any template element. A runtime rendering error in a single element propagates to the route-level `error.tsx`, resetting the entire editor state. For a stateful editor, this means users lose their unsaved work on any component error.

---

## `/old` Route — Unknown Purpose

```typescript
// src/app/(app)/old/page.tsx exists
// Listed in PROTECTED_ROUTES:
{ path: /^\/old/ }
// Listed in middleware matcher: '/old'
```

A protected route with no clear documentation of purpose. May be a legacy page kept for unknown reasons.

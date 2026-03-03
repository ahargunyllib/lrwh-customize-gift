# Risks: Fragile Code

Code paths that fail silently, have hidden preconditions, or break in non-obvious ways.
**Related**: → `engine/layers.md` (layer bug) · → `flows/template-authoring.md` (persistence bug)

---

## FRAGILE-1: layer[] Not Cleaned on Element Delete

**File**: `src/features/editor/hooks/use-template-editor.ts`
**Severity**: Medium — accumulates stale IDs, causes z-index anomalies

```typescript
// deleteElement() currently:
setTemplate(prev => ({
  ...prev,
  images: prev.images.filter(img => img.id !== id),
  texts: prev.texts.filter(t => t.id !== id),
  shapes: prev.shapes.filter(s => s.id !== id),
  lines: prev.lines.filter(l => l.id !== id),
  // BUG: layer is NOT filtered
}))
```

After deletion, stale IDs remain in `layer[]`. Elements added after the deletion receive higher-than-expected z-index values because `getLayerIndex()` returns the index in the full (unfiltered) layer array.

**Fix**: Add `layer: prev.layer.filter(layerId => layerId !== id)` to the delete logic.

---

## FRAGILE-2: Template Persistence Create-vs-Update Decision

**File**: `src/features/editor/hooks/use-template-persistence.ts`
**Severity**: High — can create duplicate templates on DB hiccup

```typescript
const save = async (template) => {
  const existing = await getTemplateById(template.id)
  if (!existing.success) {
    await createTemplate(template)    // creates if getTemplateById fails
  } else {
    await updateTemplate(template)
  }
}
```

A temporary DB error during `getTemplateById` causes `createTemplate` to be called instead of `updateTemplate`, potentially creating a duplicate template with the same client-generated UUID (which would then fail with a PK conflict).

**Expected behavior**: Error should surface to the user, not silently switch to create.

---

## FRAGILE-3: submitOrder S3 Upload Before DB Transaction

**File**: `src/shared/repository/order/action.ts`
**Severity**: Medium — orphaned S3 files on transaction failure

```typescript
// In submitOrder():
// Step 1: Uploads to S3 in parallel (outside transaction)
const uploadResults = await Promise.all(
  templates.map(t => uploadBufferToS3(buffer, key))
)

// Step 2: DB transaction (can fail after S3 uploads succeed)
await db.transaction(async (tx) => {
  // UPDATE order_product_variants.image_url
  // UPDATE orders.status
})
```

If the DB transaction fails after S3 uploads succeed, the uploaded PNG files remain in S3 permanently with no DB record. No cleanup, no retry, no rollback mechanism.

---

## FRAGILE-4: Middleware Imports from Feature Module

**Files**: `src/middlewares/role-access-guard.ts` → `src/features/dashboard/data/tabs.ts`
**Severity**: Medium — middleware behavior changes when feature code changes

```typescript
// role-access-guard.ts:
import { tabsData } from "@/features/dashboard/data/tabs"
```

Middleware should not import from feature modules. Any change to `tabsData` structure (field rename, key change) will silently break route authorization without a compiler error at the middleware level.

---

## FRAGILE-5: Font Loading Race Condition on Export

**File**: `src/features/editor/components/editor-canvas.tsx` (html2canvas call)
**Severity**: Medium — exports may contain fallback fonts in production

```typescript
// No font-loading wait before capture:
const canvas = await html2canvas(canvasRef.current, { scale: 1 })
```

Custom fonts (45+, loaded via `@font-face`) may not be fully loaded when html2canvas runs. The captured PNG will show system fallback fonts instead of the selected font.

**Fix**: `await document.fonts.ready` before html2canvas call.

---

## FRAGILE-6: AuditLog Errors Silently Swallowed

**File**: All `*/action.ts` files (createAuditLog calls)
**Severity**: Low — silent audit trail gaps

```typescript
// Pattern in every mutating SA:
await mutateMainEntity()
createAuditLog({ ... }).catch(() => {})   // error silently ignored
```

If `createAuditLog` fails (DB down, OOM, etc.), no error is surfaced. The main operation succeeds but the audit trail has a gap. No retry mechanism.

---

## FRAGILE-7: getSession() Returns Non-IronSession Object

**File**: `src/shared/repository/session-manager/action.ts`
**Severity**: Low — misleading type

```typescript
export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await _getSession()
  return JSON.parse(JSON.stringify(session))    // plain object, NOT IronSession
}
```

The return type claims `IronSession<SessionData>` but the actual return is a plain object. Calling `session.save()` or `session.destroy()` on the return value would throw at runtime. Current callers only read from it, so this doesn't cause bugs yet.

---

## FRAGILE-8: useCanvasDrop Only in isCustomizing Mode

**File**: `src/features/editor/hooks/use-canvas-drop.ts`
**Severity**: Low — may surprise developers extending the editor

`useCanvasDrop` is only activated when `isCustomizing=true`. In the admin creator mode (`TemplateCreator`), images are added through the sidebar file input, not via drag-and-drop onto the canvas. If `isCustomizing` is not set correctly, canvas drop will silently not work.

---

## Summary

| ID | File | Risk | Severity |
|---|---|---|---|
| FRAGILE-1 | `use-template-editor.ts` | Delete doesn't clean layer[] | Medium |
| FRAGILE-2 | `use-template-persistence.ts` | Create vs Update on DB error | High |
| FRAGILE-3 | `order/action.ts` | S3 orphan on transaction failure | Medium |
| FRAGILE-4 | `role-access-guard.ts` | Feature import in middleware | Medium |
| FRAGILE-5 | EditorCanvas (html2canvas call) | Font load race on export | Medium |
| FRAGILE-6 | All action.ts files | Silent audit log gaps | Low |
| FRAGILE-7 | `session-manager/action.ts` | Wrong return type | Low |
| FRAGILE-8 | `use-canvas-drop.ts` | Drop inactive outside customizing | Low |

# Flow: Template Authoring (Admin)

**Entry routes**: `/editor/create` (new) · `/editor/[id]/edit` (edit)
**Auth required**: Yes — `isLoggedIn` checked in Server Actions; routes in `PROTECTED_ROUTES`
**Related**: → `entities/template.md` · → `engine/canvas.md` · → `engine/layers.md` · → `contracts/server-actions.md`

---

## Create Flow

```
1. Admin navigates to /editor/create
2. Page loads TemplateCreator container (dynamic import, ssr: false)
3. useTemplateEditor() initializes blank TemplateData:
   { id: uuidv4(), width: 400, height: 800, images: [], texts: [], shapes: [], lines: [], layer: [] }

4. Admin selects ProductVariant from sidebar
   → template.width/height set from variant.width/height
   → template re-initialized (previous elements lost)

5. Admin adds elements via sidebar:
   addImage()   → new ImageElement, ID appended to layer[]
   addText()    → new TextElement, ID appended to layer[]
   addShape()   → new ShapeElement, ID appended to layer[]
   addLine()    → new LineElement, ID appended to layer[]

6. Admin drags/resizes elements (→ engine/rendering.md for interaction hooks)

7. Admin configures element properties (sidebar controls → updateElement())

8. Admin optionally generates preview:
   html2canvas(canvasRef.current) → PNG data URL → File object
   setTemplate({ previewFile: file })

9. Admin clicks Save
   useTemplatePersistence.save(template) is called:
   ├── If template not in DB yet: createTemplate(template) SA
   └── If already exists: updateTemplate(template, id) SA

10. createTemplate / updateTemplate SA:
    a. Checks session.isLoggedIn
    b. Uploads previewFile to S3 if present → previewUrl
    c. Strips top-level fields (id, name, productVariantId, previewUrl, previewFile)
    d. DB insert/update with remaining data as JSON blob
    e. createAuditLog() fire-and-forget
    f. Returns { success: true }
```

## Edit Flow

```
1. Admin navigates to /editor/[id]/edit
2. useTemplatePersistence calls getTemplateById(id)
3. If fails: createTemplate() path (→ fragile logic, see risks/fragile.md)
4. If succeeds: template hydrated into useTemplateEditor state
5. Admin edits as above (step 5–9)
6. Save calls updateTemplate()
```

---

## useTemplatePersistence: Create vs Update Decision

```typescript
// features/editor/hooks/use-template-persistence.ts:
const save = async (template) => {
  const existing = await getTemplateById(template.id)
  if (!existing.success) {
    await createTemplate(template)    // create if not found
  } else {
    await updateTemplate(template)    // update if found
  }
}
```

**Fragile**: If `getTemplateById` fails due to a temporary DB error, a new template is created instead of updating the existing one. → `risks/fragile.md`

---

## Preview Generation

Preview is optional. If `template.previewFile` is null, no preview image is uploaded. `previewUrl` remains null.

Preview is generated client-side using the same html2canvas pipeline used for order export (→ `engine/export.md`), but without grayscale preprocessing.

---

## Key State in useTemplateEditor

```typescript
// features/editor/hooks/use-template-editor.ts:
template: TemplateData              // full template state
activeElement: ActiveElement | null // currently selected element
editingTextId: string | null        // text element in inline edit mode
scale: number                       // current display scale (from useCanvasScale)
```

All add/update/delete operations call `setTemplate()` with an immutable update pattern.

---

## Route Protection

```typescript
// middlewares/constant.ts:
PROTECTED_ROUTES = [
  { path: /^\/editor\/[^\/]+\/edit$/ },   // /editor/:id/edit
  { path: /^\/editor\/create$/ },
]
```

`/editor/[id]` (view only, no edit) is NOT in PROTECTED_ROUTES — it is publicly accessible. This allows preview sharing without auth.

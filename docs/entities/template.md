# Entity: TemplateData

**Source**: `src/shared/types/template.ts`
**Stored in**: `templates.data` (PostgreSQL `JSON` column — not JSONB)
**Related**: → `entities/elements.md` (element subtypes) · → `engine/layers.md` (layer[] system)

---

## Runtime Type

```typescript
interface TemplateData {
  // Top-level fields (NOT stored in data column; come from DB row)
  id: string                  // UUID — generated CLIENT-SIDE via uuidv4()
  name: string
  productVariantId?: string   // FK → product_variants.id
  previewUrl: string | null   // S3 URL
  previewFile: File | null    // client-only, never persisted

  // Stored in data column:
  width: number               // canvas pixels (from productVariant.width)
  height: number              // canvas pixels (from productVariant.height)
  backgroundColor: string     // CSS color
  backgroundImage?: string    // URL or data URL
  images: ImageElement[]
  texts: TextElement[]
  shapes: ShapeElement[]
  lines: LineElement[]
  layer: string[]             // ordered element IDs — defines z-index (bottom → top)
}
```

## JSON Column Shape

What is actually stored in `templates.data`:

```json
{
  "width": 400,
  "height": 800,
  "backgroundColor": "#ffffff",
  "backgroundImage": null,
  "images": [...],
  "texts": [...],
  "shapes": [...],
  "lines": [...],
  "layer": ["uuid-1", "uuid-2", "uuid-3"]
}
```

`id`, `name`, `productVariantId`, `previewUrl` are separate DB columns, not in `data`.

---

## DB Table: `templates`

```
id                TEXT PK      (client-generated UUID — not a DB default)
name              VARCHAR(255) NOT NULL
product_variant_id UUID        FK → product_variants (CASCADE DELETE)
data              JSON         NOT NULL  ← the blob above
preview_url       TEXT         nullable
created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
```

No `updated_at`. No unique constraint on `name`.
Column type is `JSON` not `JSONB` — JSON operators not usable in queries.

---

## Critical Invariants

### INV-1: Client-Generated ID
`id` is assigned in the browser via `uuidv4()` before the Server Action is called.
The DB insert uses `req.id` verbatim — no server-generated fallback.

**Consequence**: If two clients generate the same UUID (astronomically unlikely), the insert silently overwrites on upsert, or fails on conflict. There is no duplicate-check.

### INV-2: layer[] is the z-index source of truth
Every element ID must appear in `layer[]`. Index position = CSS z-index.
- Elements with IDs absent from `layer[]` render at z-index 0 (behind everything).
- Stale IDs in `layer[]` after deletion are harmless but accumulate. → See `engine/layers.md` for the delete bug.

### INV-3: width/height come from ProductVariant
`TemplateData.width` and `TemplateData.height` are set from `productVariant.width/height` at creation time. They are NOT recalculated if the variant dimensions change later. Existing templates will have mismatched dimensions if the variant is edited.

### INV-4: previewFile is transient
`previewFile: File` is client-only. It is never serialized to JSON. It is consumed by the Server Action to upload to S3 and then discarded. Do not attempt to persist or hydrate this field.

---

## Template Lifecycle States

Templates have no `status` field. Existence implies availability.

```
Created (via createTemplate SA) → Stored → Available for user selection
                                          ↓
                               Edited (via updateTemplate SA)
                                          ↓
                               Deleted (via deleteTemplate SA) → cascades nothing
                               (orders reference productVariant, not template)
```

---

## Querying

Templates use **raw SQL** (not Drizzle query builder) in `shared/repository/templates/action.ts`:

```typescript
sql`SELECT * FROM templates WHERE id = ${id}`
sql`INSERT INTO templates (id, name, ...) VALUES (...)`
```

All other entities use Drizzle's query builder. → See `risks/debt.md` for this inconsistency.

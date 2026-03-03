# Domain Model

## Entity Overview

```
Product ──< ProductVariant ──< Template
                │
                └──< OrderProductVariant >── Order
                                │
                                └── imageUrl (submitted PNG)

User (admin/superadmin)
AuditLog ──> User
```

---

## Entity: Product

**Table**: `products`
**File**: `src/server/db/schema/products.ts`
**Type**: `src/shared/types/product.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `defaultRandom()` | |
| `name` | varchar(255) | NOT NULL | |
| `description` | varchar(1000) | nullable | |
| `shopeeUrl` | varchar(255) | nullable | External product link |
| `createdAt` | timestamp | NOT NULL, `defaultNow()` | |
| `updatedAt` | timestamp | NOT NULL, `defaultNow()`, auto-update | |

### Relationships
- One Product → Many ProductVariants (cascade delete)

### Lifecycle
- Created by admin via dashboard Product Management
- Deletion cascades to ProductVariants → OrderProductVariants → broken Orders (cascade chain)

### Validation
- `name`: required, min 1 char (zod)
- `shopeeUrl`: valid URL or empty (zod)

---

## Entity: ProductVariant

**Table**: `product_variants`
**File**: `src/server/db/schema/products.ts`
**Type**: `src/shared/types/product.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `defaultRandom()` | |
| `productId` | UUID | NOT NULL, FK → products.id (cascade delete) | |
| `name` | varchar(255) | NOT NULL (column name: `variant_name`) | |
| `description` | varchar(1000) | nullable | |
| `width` | integer | NOT NULL, default 0 | Canvas width in pixels |
| `height` | integer | NOT NULL, default 0 | Canvas height in pixels |
| `createdAt` | timestamp | NOT NULL | |
| `updatedAt` | timestamp | NOT NULL, auto-update | |

### Relationships
- Many ProductVariants → One Product
- One ProductVariant → Many Templates (cascade delete)
- One ProductVariant → Many OrderProductVariants (cascade delete)

### Lifecycle
- Created and managed within Product Management dashboard
- `width` and `height` define the canvas dimensions for all templates of this variant
- Changing width/height does NOT automatically rescale existing templates

### Constraints
- `width` ≥ 1, `height` ≥ 1 (zod validation at DTO level)

---

## Entity: Template

**Table**: `templates`
**File**: `src/server/db/schema/templates.ts`
**Type**: `src/shared/types/template.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | text | PK | UUID generated client-side via `uuidv4()` |
| `name` | varchar(255) | NOT NULL | |
| `productVariantId` | UUID | NOT NULL, FK → product_variants.id (cascade delete) | |
| `data` | JSON | NOT NULL | Stores `Omit<TemplateData, "id"\|"name"\|"productVariantId"\|"previewUrl"\|"previewFile">` |
| `previewUrl` | text | nullable | S3 URL of preview image |
| `createdAt` | timestamp | NOT NULL, `defaultNow()` | |

### The `data` JSON Column Structure

```typescript
{
  width: number,           // pixels
  height: number,          // pixels
  backgroundColor: string, // hex color
  backgroundImage?: string, // URL or data URL
  images: ImageElement[],
  texts: TextElement[],
  shapes: ShapeElement[],
  lines: LineElement[],
  layer: string[]          // ordered array of element IDs (bottom → top)
}
```

### Relationships
- Many Templates → One ProductVariant
- Template is linked to OrderProductVariant at runtime (not in DB schema — only via matching productVariantId)

### Lifecycle
1. Admin creates template in `/editor/create`
2. `createTemplate()` Server Action: uploads previewFile to S3, inserts row
3. Template can be edited at `/editor/[id]/edit`
4. `updateTemplate()` re-uploads preview, updates data column
5. Template can be deleted (`deleteTemplate()`); cascade-safe since no FK from orders to templates

### Constraints
- Template ID is generated client-side (UUID v4), not database-generated
- Preview file: validated PNG, max 8MB
- No uniqueness constraint on `name`

### State Transitions
Templates are stateless — they don't have a status field. They are either present (can be selected) or deleted.

---

## Entity: TemplateData (TypeScript Runtime Type)

Not a DB entity — the in-memory representation when working with templates.

```typescript
interface TemplateData {
  id: string
  name: string
  productVariantId?: string
  previewUrl: string | null
  previewFile: File | null          // client-only, not persisted
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
  images: ImageElement[]
  texts: TextElement[]
  shapes: ShapeElement[]
  lines: LineElement[]
  layer: string[]                   // element ID ordering
}
```

---

## Entity: ImageElement

Sub-entity within `TemplateData.images[]`.

```typescript
interface ImageElement {
  id: string                        // UUID
  type: "image"
  src: string                       // URL or data URL
  position: { x: number; y: number }
  width: number                     // frame width in pixels
  height: number                    // frame height in pixels
  rotate?: number                   // degrees
  zIndex: number
  draggable: boolean                // false = locked (user cannot move)
  borderRadius?: number
  grayscale?: boolean
  grayscalePercent?: number         // 0-100
  imageOffset?: { x: number; y: number }  // pan within frame
  scaleX?: number                   // image scale within frame
  scaleY?: number
  centerX?: boolean
  centerY?: boolean
  naturalWidth?: number             // original image dimensions
  naturalHeight?: number
}
```

**Lifecycle**: Created by admin in editor. User may add new images when `isCustomizing=true`. `draggable=false` locks elements the admin has fixed.

---

## Entity: TextElement

Sub-entity within `TemplateData.texts[]`.

```typescript
interface TextElement {
  id: string
  type: "text"
  content: string
  position: { x: number; y: number }
  width: number
  height: number
  draggable?: boolean
  zIndex?: number
  rotate?: number
  textLimit?: number                // max character count

  style: {
    fontFamily: string
    fontSize: string | number       // e.g. "24px" or 24
    fontWeight: string
    color: string
    textAlign: string               // "left" | "center" | "right"
    lineHeight: string
    verticalAlign?: "top" | "middle" | "bottom"
    curved?: boolean
    curveRadius?: number
    curveDirection?: "up" | "down"
    curveIntensity?: number
    rotate?: number
    centerX?: boolean
    centerY?: boolean
    maxWidth?: number | string
    backgroundColor?: string
    borderRadius?: number
    padding?: string | number
    // ... padding variants
    letterSpacing?: string | number
    underline?: boolean
    italic?: boolean
    textStroke?: string
    WebkitTextStroke?: string
    outlineWidth?: number
    outlineColor?: string
  }
}
```

---

## Entity: ShapeElement

Sub-entity within `TemplateData.shapes[]`.

```typescript
interface ShapeElement {
  id: string
  type: "shape"
  variant: "rectangle" | "circle" | "triangle"
  width: number
  height: number
  draggable?: boolean
  position: { x: number; y: number }
  rotation: number                  // degrees
  fill: string                      // hex color
  borderColor: string
  borderWidth: number
  borderRadius: number
  opacity: number                   // 0-100
  zIndex: number
}
```

---

## Entity: LineElement

Sub-entity within `TemplateData.lines[]`.

```typescript
interface LineElement {
  id: string
  type: "line"
  variant: "line-thin" | "line-medium" | "line-thick" | "line-dashed" | "line-dotted" | "line-arrow" | "line-rounded"
  draggable?: boolean
  strokeColor: string
  strokeWidth: number
  opacity: number                   // 0-100 (assumption: percentage)
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
  startTip?: "none" | "arrow" | "circle" | "square" | "rounded"
  endTip?: "none" | "arrow" | "circle" | "square" | "rounded"
  zIndex?: number
}
```

---

## Entity: Order

**Table**: `orders`
**File**: `src/server/db/schema/orders.ts`
**Type**: `src/shared/types/order.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `defaultRandom()` | |
| `orderNumber` | varchar(255) | NOT NULL | External order reference |
| `username` | varchar(255) | NOT NULL | Customer username |
| `status` | varchar(50) | NOT NULL, default `"no-images"` | `"no-images"` \| `"progress"` \| `"completed"` |
| `createdAt` | timestamp | NOT NULL, `defaultNow()` | |

### Relationships
- One Order → Many OrderProductVariants (cascade delete)

### Lifecycle / State Transitions

```
no-images  →  progress  →  completed
   │               │
   └── (0 images)  └── (some images submitted, not all)
                           │
                           └── all images submitted = completed
```

State is calculated and set by `submitOrder()` server action:
- `no-images`: 0 imageUrls filled
- `progress`: some but not all imageUrls filled
- `completed`: all imageUrls filled

### Validation
- `orderNumber`: required, min 1 char
- `username`: required, min 1 char
- `productVariants`: array with at least one item, valid UUID, quantity ≥ 1

---

## Entity: OrderProductVariant

**Table**: `order_product_variants`
**File**: `src/server/db/schema/orders.ts`
**Type**: `src/shared/types/order.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `defaultRandom()` | Used as `orderProductVariantId` in submission |
| `orderId` | UUID | NOT NULL, FK → orders.id (cascade delete) | |
| `productVariantId` | UUID | NOT NULL, FK → product_variants.id (cascade delete) | |
| `imageUrl` | varchar(255) | nullable | S3 URL after user submission |

### Role
This is the **photo slot** entity. Each `OrderProductVariant` row represents one product variant slot in an order that requires a user-submitted photo. Multiple rows can exist for the same `productVariantId` within one order (for quantity > 1).

### Lifecycle
1. Created when admin creates an order (one row per quantity unit)
2. `imageUrl` is null until user submits photo
3. User submits: `submitOrder()` validates PNG, uploads to S3, sets `imageUrl`
4. Once `imageUrl` is set, it cannot be overwritten (server rejects with "Image already submitted")

---

## Entity: User

**Table**: `users`
**File**: `src/server/db/schema/users.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | integer | PK, `generatedAlwaysAsIdentity()` | Auto-increment |
| `name` | varchar(255) | NOT NULL | |
| `email` | varchar(255) | NOT NULL, UNIQUE | |
| `role` | integer | NOT NULL | 1 = admin, 2 = superadmin |
| `password` | varchar(255) | NOT NULL | bcrypt hash |
| `createdAt` | timestamp | NOT NULL, `defaultNow()` | |

### Relationships
- One User → Many AuditLogs

### Role System
- Role `1` (admin): Standard admin, limited dashboard tabs
- Role `2` (superadmin): Extended access including user management
- See `src/shared/lib/enums.ts` and `src/features/dashboard/data/tabs.ts` for tab mappings

### Security
- Password hashed with bcrypt-ts, 10 rounds
- No email verification
- No account lockout mechanism detected

---

## Entity: AuditLog

**Table**: `audit_logs`
**File**: `src/server/db/schema/audit-logs.ts`
**Type**: `src/shared/types/audit-log.ts`

### Fields

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, `defaultRandom()` | |
| `userId` | integer | NOT NULL, FK → users.id (cascade delete) | |
| `action` | varchar(50) | NOT NULL | `"CREATE"` \| `"UPDATE"` \| `"DELETE"` |
| `entityType` | varchar(50) | NOT NULL | `"product"` \| `"product_variant"` \| `"order"` \| `"template"` |
| `entityId` | varchar(255) | NOT NULL | ID of affected entity |
| `entityName` | varchar(255) | nullable | Human-readable name |
| `details` | jsonb | nullable | Additional context |
| `createdAt` | timestamp | NOT NULL, `defaultNow()` | |

### Lifecycle
- Created automatically as "fire-and-forget" after every admin CRUD operation
- Never modified or deleted directly
- Cascades if the associated User is deleted (could lose audit trail if admin is deleted)

---

## Complete Flow: Admin Creates Template

```
1. Admin navigates to /editor/create
2. TemplateCreator container loads (useTemplateEditor hook initializes blank TemplateData)
3. Admin selects ProductVariant (sets canvas dimensions from variant.width/height)
4. Admin adds elements: images, texts, shapes, lines
5. Admin configures each element (position, style, draggable flag)
6. Admin generates preview (html2canvas-pro captures canvas as PNG data URL)
7. Admin clicks Save
8. useTemplatePersistence.save() called with TemplateData
9. createTemplate() Server Action:
   a. Checks session.isLoggedIn
   b. Uploads previewFile to S3
   c. Inserts row: id(client-generated UUID), name, productVariantId, previewUrl, data(JSON blob)
   d. Creates AuditLog (fire-and-forget)
10. Template visible in product variant's template list
```

## Complete Flow: User Injects Photo

```
1. User visits /templates/onboarding
2. User enters username + orderNumber
3. verifyOrderByUsernameAndOrderNumber() returns order with productVariants
4. Order stored in Zustand useTemplatesStore
5. User redirected to /templates?productVariantId=...
6. User sees templates for their product variant
7. User clicks a template → /templates/[templateId]?orderProductVariantId=...
8. Validation: orderProductVariantId must be in Zustand store (prevents unauthorized access)
9. getTemplateById() fetches template JSON from DB
10. TemplateEditor renders EditorCanvas with isCustomizing=true
11. User adds/replaces images (drag-drop or upload)
12. User edits editable text fields (if draggable=true)
13. User clicks submit button
14. prepareCanvasForExport() applies grayscale via canvas pixel manipulation
15. html2canvas-pro captures EditorCanvas DOM element → PNG data URL
16. submitOrder() Server Action called with {orderId, [{orderProductVariantId, dataURL}]}
17. Server validates: PNG magic bytes, size ≤ 8MB, not already submitted
18. Server uploads buffer to S3 with key: "{username}_{orderNumber}_{sha256}.png"
19. order_product_variants.image_url updated
20. Order status recalculated and updated
21. User sees completion state
```

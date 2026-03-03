# Entity: Order & OrderProductVariant

**Source**: `src/server/db/schema/orders.ts`, `src/shared/types/order.ts`
**Related**: → `flows/order-customization.md` (lifecycle) · → `contracts/validation.md` (submit rules) · → `infra/storage.md` (image upload)

---

## Order

```
Table: orders
─────────────────────────────────────────────────────
id           UUID PK DEFAULT gen_random_uuid()
order_number VARCHAR(255) NOT NULL
username     VARCHAR(255) NOT NULL
status       VARCHAR(50)  NOT NULL DEFAULT 'no-images'
created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
```

No `updated_at`. No unique constraint on `(username, order_number)` — **duplicate orders are possible**.
Status is a plain string — no DB-level enum constraint.

### Status Machine

```
no-images ──► progress ──► completed
   │               │
   0 imageUrls     some imageUrls filled, not all
                                   │
                         all imageUrls filled = completed
```

Status is **computed and set** by `submitOrder()` Server Action after each image upload. It is not a DB trigger or constraint.

```typescript
// Logic in shared/repository/order/action.ts:
const total = allVariants.length
const filled = allVariants.filter(v => v.imageUrl !== null).length
const newStatus =
  filled === 0 ? "no-images" :
  filled < total ? "progress" : "completed"
```

---

## OrderProductVariant

```
Table: order_product_variants
─────────────────────────────────────────────────────
id                  UUID PK DEFAULT gen_random_uuid()
order_id            UUID NOT NULL FK → orders(id) CASCADE DELETE
product_variant_id  UUID NOT NULL FK → product_variants(id) CASCADE DELETE
image_url           VARCHAR(255) nullable
```

**This is the photo slot entity.** One row = one product item in an order that needs a photo.
Multiple rows can share the same `product_variant_id` within one order (for quantity > 1).

### imageUrl: Write-Once Invariant

Once `image_url` is non-null, `submitOrder()` rejects further writes:

```typescript
// shared/repository/order/action.ts:
if (existingVariant.imageUrl !== null) {
  return { success: false, error: "Image already submitted" }
}
```

This is enforced in the Server Action only — **no DB-level constraint**. Bypassing the SA allows overwrite.

### Cascade Risks

| Event | Consequence |
|---|---|
| `orders` deleted | All `order_product_variants` deleted (CASCADE) |
| `product_variants` deleted | All `order_product_variants` deleted (CASCADE) + `image_url` lost |

Deleting a `product_variant` with active orders destroys order image data. No business-level guard exists.

---

## Missing Constraints / Indexes

| Missing | Impact |
|---|---|
| UNIQUE on `(orders.username, orders.order_number)` | Duplicate orders can be created |
| INDEX on `order_product_variants.order_id` | submitOrder + getOrders scan full table |
| INDEX on `order_product_variants.product_variant_id` | getOrders scan |
| INDEX on `orders.status` | getOrders status filter |
| INDEX on `orders.created_at` | default sort column |

→ See `infra/database.md` for full index analysis.

---

## Runtime Types

```typescript
interface Order {
  id: string
  orderNumber: string
  username: string
  status: "no-images" | "progress" | "completed"
  createdAt: Date
}

interface OrderProductVariant {
  id: string                  // used as `orderProductVariantId` in submitOrder
  orderId: string
  productVariantId: string
  imageUrl: string | null
}
```

---

## verifyOrder Response Shape

`verifyOrderByUsernameAndOrderNumber()` returns a denormalized structure used to populate the Zustand store:

```typescript
{
  id: string,
  username: string,
  orderNumber: string,
  productVariants: [{
    id: string,               // product_variant.id
    name: string,
    product: { id: string; name: string },
    templates: [{
      id: string,             // order_product_variant.id  ← NOT template.id
      dataURL: null           // null until user submits
    }]
  }]
}
```

**Naming hazard**: The field `templates[].id` in this response is actually an `order_product_variant.id`, not a template ID. It is referred to as `orderProductVariantId` everywhere else.

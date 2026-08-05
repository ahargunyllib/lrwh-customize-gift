# Flow: Order Customization (User)

**Entry route**: `/templates/onboarding`
**Auth required**: No — users authenticate via username + orderNumber only
**Related**: → `entities/order.md` · → `engine/export.md` · → `contracts/validation.md` · → `infra/storage.md`

---

## Full Flow

```
1. User navigates to /templates/onboarding
2. Submits username + orderNumber
3. verifyOrderByUsernameAndOrderNumber({ username, orderNumber }) SA:
   ├── Queries order + orderProductVariants + productVariants + products
   └── Returns denormalized order object

4. Order stored in Zustand: useTemplatesStore.setOrder(order)
5. User redirected to /templates?productVariantId={first_variant_id}

6. /templates page renders:
   ├── Product variants as tabs (from Zustand store)
   └── Templates list: getTemplates({ productVariantId }) SA

7. User selects a template
   → Navigates to /templates/{templateId}?orderProductVariantId={opvId}

8. /templates/[id] page:
   ├── Client validates: orderProductVariantId must exist in Zustand store
   ├── If invalid → router.back() (prevents unauthorized access)
   └── getTemplateById(templateId) SA → hydrates TemplateEditor

9. TemplateEditor renders EditorCanvas without passing isCustomizing (defaults to false):
   ├── initialTemplate = null (blank slate) on first visit
   └── OR initialTemplate = stored state if returning

10. User adds/replaces images:
    useCanvasDrop handles file drop or upload
    → FileReader → data URL → addImage() → ImageElement created

11. User edits unlocked text elements (draggable=true):
    Double-click → textarea → content change → validateTextElement()

12. User clicks Submit (SendDialog/SendSheet)

13. Client-side export:
    prepareCanvasForExport(canvasRef, template)    [grayscale preprocessing]
    html2canvas(canvasRef.current, { scale: 1 })   [DOM capture]
    canvas.toDataURL("image/png")                   [base64 data URL]

14. submitOrder({ orderId, templates: [{ orderProductVariantId, dataURL }] }) SA:
    a. Validate orderId exists
    b. Validate orderProductVariantId belongs to order
    c. Validate imageUrl is null (not already submitted)
    d. parseDataUrl(dataURL) → validate PNG magic bytes + size ≤ 8MB
    e. Upload to S3: key = `{username}_{orderNumber}_{sha256}.png`
    f. UPDATE order_product_variants SET image_url = s3Url WHERE id = opvId
    g. Recalculate order status (no-images / progress / completed)
    h. UPDATE orders SET status = newStatus

15. Returns { status, remainingCount }
16. User sees completion state
```

---

## Zustand Store: useTemplatesStore

```typescript
// features/templates/stores/use-templates-store.ts:
{
  order: VerifiedOrder | null,
  productVariants: ProductVariantWithTemplates[],
  setOrder(order),
  clearOrder(),
}
```

**Session-only** — not persisted to localStorage. Refreshing the browser clears the store.

**Access gate**: `/templates/[id]` validates the `orderProductVariantId` query param against the store. If the store is empty (after refresh), the user is redirected away. Deep links to `/templates/[id]` do not work without the full onboarding flow completing first.

---

## isCustomizing Flag Behavior

**Naming caveat**: despite the name, `isCustomizing={true}` is passed only by `TemplateCreator` — the **admin authoring tool** (`/editor/create`, `/editor/[id]/edit`). `TemplateEditor` — used by both the real customer session (this flow) and the admin's "Test" preview route (`/editor/[id]`) — never passes it, so it defaults to `false`. The bullets below were previously mislabeled (swapped); this reflects the verified code behavior. → See `entities/elements.md`.

When `isCustomizing=false` (this flow, and the admin's Test route):
- Elements with `draggable=false` cannot be repositioned
- Elements with `isSizeLocked` set (text only) cannot be resized; box/font size are frozen — see `entities/elements.md`
- Text with `textLimit` set enforces character limit
- Sidebar shows only user-permitted controls (not all creator controls)

When `isCustomizing=true` (admin creator mode, `TemplateCreator` only):
- `useCanvasDrop` is active (image drop/upload enabled)
- All elements are draggable/resizable regardless of `draggable`/`isSizeLocked` fields
- Full sidebar with all controls

---

## Multiple Templates per Order

An order can have multiple `OrderProductVariant` rows (multiple slots). The user visits `/templates` with different `productVariantId` query params to select a template for each slot. `submitOrder` accepts an array of `{ orderProductVariantId, dataURL }` pairs — multiple slots can be submitted in one call.

Status progression:
- After submitting the first slot: `no-images` → `progress`
- After submitting all slots: `progress` → `completed`

---

## No User Account

Users have no account/password. Authentication is:
1. `verifyOrderByUsernameAndOrderNumber()` — proves they know username + order number
2. Client-side Zustand store holds the verified order
3. `submitOrder()` accepts `orderId` directly — **no re-verification that the caller owns the order** → `risks/security.md`

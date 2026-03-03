# Performance Analysis

## Database

### N+1 Query Patterns

#### `getOrders()` — 4 sequential queries

```typescript
// Query 1: Fetch paginated orders
db.select().from(ordersTable).where(filters).limit().offset()

// Query 2: Count orders
db.select({ count }).from(ordersTable).where(filters)

// Query 3: Fetch order_product_variants for all order IDs
db.select().from(orderProductVariantsTable).where(inArray(orderId, orderIds))

// Query 4: Fetch product_variants + products for all variant IDs
db.select(...).from(productVariantsTable).innerJoin(productsTable, ...)
```

**Assessment**: This pattern is acceptable — queries 3 and 4 are batch fetches using `inArray`, not row-by-row N+1. However, a single JOIN query would be more efficient.

#### `verifyOrderByUsernameAndOrderNumber()` — 4 sequential queries

Similar pattern: order → order_product_variants → product_variants (with products JOIN).

**Assessment**: Could be consolidated into 2 queries or 1 query with JOINs.

#### `getProducts()` — 3 sequential queries

```typescript
// Query 1: Paginated products
// Query 2: Count products
// Query 3: All variants for fetched product IDs (inArray batch)
```

**Assessment**: Acceptable batch pattern. No per-row N+1.

### Missing Database Indexes

See [database.md](./database.md) for full index analysis. Critical missing indexes:

| Table | Column | Impact |
|---|---|---|
| `templates` | `product_variant_id` | Every template list fetch does full scan |
| `order_product_variants` | `order_id` | submitOrder + getOrders scans full table |
| `order_product_variants` | `product_variant_id` | getOrders scans full table |
| `orders` | `created_at` | Default sort column, no index |
| `orders` | `status` | Filtered frequently in getOrders |
| `audit_logs` | `created_at` | Default sort, no index |

**Impact grows with data volume.** With small datasets, this is not observable. At scale (thousands of orders/templates), full-table scans will cause slow page loads.

---

## Client-Side Performance

### Large HTML2Canvas Capture

`html2canvas-pro` captures the entire `EditorCanvas` DOM. The canvas size is defined by `productVariant.width × productVariant.height` pixels. At scale=1, this is the natural pixel size.

**Problem**: If the product variant has large dimensions (e.g., 2000×3000px), html2canvas must process a very large DOM subtree and render it pixel-by-pixel. This can take seconds and may freeze the UI.

**No web worker or async worker is used** for the capture — it blocks the main thread.

### Font Loading for Export

`html2canvas-pro` captures DOM as-is. Custom fonts (45+ loaded via `@font-face`) must be fully loaded in the browser before capture. If capture happens before fonts finish loading, text will render in a fallback font.

**No explicit font-ready check detected** before html2canvas capture.

### Canvas-Based Grayscale Processing

`prepareCanvasForExport()` uses `canvas.getImageData()` and pixel-by-pixel iteration for grayscale blending:

```typescript
for (let i = 0; i < data.length; i += 4) {
  const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
  data[i] = data[i] * (1 - factor) + gray * factor
  // ...
}
```

For a 2000×2000px image, this iterates 4,000,000 pixel values. This runs synchronously on the main thread and will block UI for large images.

**No WebGL, OffscreenCanvas, or worker used.**

### Text Height Calculation

`calculateTextHeight()` creates a temporary `<canvas>` element and uses `ctx.measureText()` for word-wrapping calculation. This is called in `useAutoTextHeight` on every text content change.

**Concern**: Creates a new canvas element on every call. Could be memoized with a persistent canvas reference.

### Custom Event System for Drag

Element dragging uses a custom DOM event system:

```typescript
// use-element-drag.ts:
document.dispatchEvent(new CustomEvent("elementMove", { detail: {...} }))

// use-element-move.ts:
document.addEventListener("elementMove", handler)
```

This bypasses React's synthetic event system. `document.addEventListener` in hooks must clean up correctly to avoid memory leaks. The cleanup is present in `useEffect` return, so this appears handled.

### Unoptimized State Updates During Drag

During drag operations, `setTemplate` is called on every `mousemove` event, triggering React re-renders at up to 60fps. The template state update causes all elements in `EditorCanvas` to re-render.

**No `React.memo` or `useMemo` detected** on individual element components (`TemplateImage`, `TemplateText`, etc.). Every mouse move re-renders all elements.

### Zustand Store for Order Data

The entire order object (with all product variants and template slots) is stored in Zustand. For orders with many product variants and many templates, this could be a large in-memory object. However, for the expected scale of this application, this is acceptable.

---

## Rendering Performance

### Canvas Scale via CSS Transform

The canvas uses `transform: scale(scale)` with a fixed pixel size:

```tsx
<div
  style={{
    width: template.width * scale,
    height: template.height * scale,
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  }}
/>
```

This means the DOM element is rendered at `width * scale` pixels but visually scaled back to `scale`. This doubles the pixel count for sub-1 scales and over-renders for large canvases. A better approach would set `width: template.width` and let the scale handle sizing without doubling dimensions.

### Dynamic Imports with `ssr: false`

The template editor is loaded with `dynamic(() => import(...), { ssr: false })` to prevent SSR. This means the initial page load shows a loading state while the editor bundle downloads. For users on slow connections, this introduces noticeable latency.

No `loading` skeleton is shown for all editor routes — some show a plain `<div>Loading...</div>`.

---

## Bundle Size

### Large Dependencies

| Dependency | Concern |
|---|---|
| `recharts` | Full charting library included, minimal usage detected |
| `@radix-ui/*` (30+ packages) | Many primitives imported; tree-shaking should handle unused |
| `html2canvas-pro` + `html-to-image` | Two similar capture libraries bundled |
| `lucide-react` (0.503.0) | Large icon set — tree-shaking should handle |
| 45+ custom fonts | All loaded via CSS `@font-face` — not all may be used |

### Font Loading

All 45+ fonts are declared in `fonts.css` via `@font-face`. Every font file is linked even if not used on the current page. Font files are in `/public/fonts` with no lazy loading strategy.

**Improvement**: Subset fonts, lazy-load only fonts used in current templates.

---

## Server-Side Performance

### Server Action Body Size

Body size limit is `100mb` for Server Actions. This allows large base64 data URL payloads but also means malicious actors could send up to 100MB per request.

### No Caching

No caching strategy detected:
- No Next.js `revalidate` or ISR for template data
- No CDN layer in front of Next.js
- No Redis or in-memory cache for frequently read data
- S3 proxy route (`/api/files/*`) returns `Cache-Control: public, max-age=31536000, immutable` — correct caching for assets

### Database Connection Pool

Default `pg.Pool` configuration (10 connections max). No explicit tuning for production load.

---

## Summary: High-Impact Issues

| Issue | Severity | Area |
|---|---|---|
| Missing DB indexes on `product_variant_id`, `order_id`, etc. | High | Database |
| html2canvas main thread blocking | Medium | Client export |
| Pixel-level grayscale on main thread | Medium | Client export |
| No memoization on canvas elements during drag | Medium | Editor rendering |
| No font-loading guarantee before export | Medium | Export quality |
| All 45+ fonts loaded on every page | Low | Bundle size |
| Two image capture libraries bundled | Low | Bundle size |
| recharts included with minimal usage | Low | Bundle size |
| Double pixel sizing for canvas element | Low | Editor rendering |

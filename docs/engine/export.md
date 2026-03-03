# Engine: Export Pipeline

**Source**: `src/shared/lib/elements.ts` (preprocessing), `html2canvas-pro` (capture), `src/shared/repository/order/action.ts` (submitOrder)
**Related**: → `flows/order-customization.md` (when export is triggered) · → `contracts/validation.md` (PNG rules) · → `infra/storage.md` (S3 upload)

---

## Pipeline Overview

```
1. prepareCanvasForExport(canvasRef, template)   [client, lib/elements.ts]
   └── Find grayscale images in DOM
   └── For each: canvas pixel-level grayscale blend → replace img.src with data URL
   └── Returns cleanup function (restores original src values)

2. html2canvas(canvasRef.current, { scale: 1 })  [client, html2canvas-pro]
   └── Captures the DOM canvas element as an HTMLCanvasElement
   └── Uses html2canvas-pro v1.5.11 (not the standard html2canvas)

3. canvas.toDataURL("image/png")                  [browser API]
   └── Returns base64-encoded PNG data URL

4. cleanup()                                       [client]
   └── Restores original img.src values (undo grayscale preprocessing)

5. submitOrder({ orderId, templates: [{ orderProductVariantId, dataURL }] })
   └── Server Action — see contracts/server-actions.md
```

---

## Why Grayscale Preprocessing Exists

CSS `filter: grayscale()` is not reliably captured by html2canvas. The system works around this by:

1. Finding all images with `grayscale: true` in the DOM
2. Drawing each `img` onto an offscreen `<canvas>`
3. Applying pixel-level grayscale blend:
   ```typescript
   // lib/elements.ts — applyGrayscaleToImage():
   for (let i = 0; i < data.length; i += 4) {
     const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
     const factor = grayscalePercent / 100
     data[i]     = data[i]     * (1 - factor) + gray * factor   // R
     data[i + 1] = data[i + 1] * (1 - factor) + gray * factor   // G
     data[i + 2] = data[i + 2] * (1 - factor) + gray * factor   // B
   }
   ```
4. Converting to data URL and replacing `img.src`
5. html2canvas then captures the preprocessed img

**Performance**: Iterates every pixel. For a 2000×2000px image: 4,000,000 iterations, synchronous on main thread. → `risks/fragile.md`

---

## html2canvas-pro Limitations & Known Issues

| Issue | Detail |
|---|---|
| Custom font loading | Fonts must be loaded in browser before capture. No explicit `document.fonts.ready` wait. Capture before font load = fallback font in export. |
| CSS `filter` | Unreliable — handled by grayscale preprocessing (above). |
| `overflow: hidden` | Generally works but complex clip paths may not render correctly. |
| Scale = 1 | Capture at `scale: 1` means output is at natural pixel dimensions, not viewport size. |

**Two capture libraries installed**: `html2canvas-pro@1.5.11` AND `html-to-image@1.11.11`. Only `html2canvas-pro` is used in the submission flow. `html-to-image` is a dead dependency. → `risks/debt.md`

---

## submitOrder Server-Side Validation

After receiving the data URL:

```typescript
// shared/repository/order/action.ts:

// 1. MIME check (from data URL prefix):
if (mime !== "image/png") return error

// 2. PNG magic bytes (first 8 bytes):
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
if (!buf.slice(0, 8).every((b, i) => b === PNG_MAGIC[i])) return error

// 3. Size limit:
export const MAX_BYTES = 8 * 1024 * 1024   // 8MB decoded
if (buf.length > MAX_BYTES) return error
```

These checks are hardcoded to PNG. Changing export format requires updating all three checks. → `contracts/validation.md`

---

## S3 Key Format

```typescript
// Key constructed in submitOrder:
const hash = sha256(buf)   // from lib/data-url.ts
const key = `${order.username}_${order.orderNumber}_${hash}.png`
```

Properties:
- Deterministic: same image content = same key (deduplication via hash)
- Human-readable in S3 console
- No path prefix/folder — all files in bucket root

→ `infra/storage.md` for upload mechanics.

---

## Invariant: submitOrder Assumes PNG

The entire pipeline — `toDataURL`, MIME validation, magic bytes check, S3 key suffix — assumes PNG output.

`submitOrder` server action body size limit: inherited from `next.config.ts`:
```typescript
serverActions: { bodySizeLimit: '100mb' }
```

An 8MB decoded PNG is ~11MB base64 encoded. Per-template. Multiple templates in one `submitOrder` call multiplies this.

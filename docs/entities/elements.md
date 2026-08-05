# Entity: Canvas Elements

**Source**: `src/shared/types/template.ts`, `src/shared/types/element/`
**Parent**: stored in `TemplateData.images[]`, `.texts[]`, `.shapes[]`, `.lines[]`
**Related**: → `engine/rendering.md` (how each type renders) · → `engine/layers.md` (z-index) · → `engine/canvas.md` (coordinate space)

---

## ImageElement

```typescript
interface ImageElement {
  id: string                          // UUID, generated client-side
  type: "image"
  src: string                         // URL or base64 data URL
  position: { x: number; y: number }  // natural pixels (unscaled)
  width: number                       // frame width in natural pixels
  height: number                      // frame height in natural pixels
  rotate?: number                     // degrees
  zIndex: number                      // legacy field; actual z-index from layer[]
  draggable: boolean                  // false = locked (user cannot move in customizing mode)
  borderRadius?: number               // applied to frame div
  grayscale?: boolean
  grayscalePercent?: number           // 0–100
  imageOffset?: { x: number; y: number }  // pan of img within frame (natural pixels)
  scaleX?: number                     // img zoom within frame
  scaleY?: number
  centerX?: boolean
  centerY?: boolean
  naturalWidth?: number               // original image dimensions (metadata only)
  naturalHeight?: number
}
```

**Cropping model**: The element is a fixed-size frame with `overflow: hidden`. The `<img>` inside is panned (`imageOffset`) and zoomed (`scaleX/Y`) within the frame. There is no true crop — it is pan+zoom-within-frame. → See `engine/rendering.md`.

**Grayscale**: Two mechanisms:
1. CSS `filter: grayscale()` — display only
2. Canvas pixel manipulation before export — see `engine/export.md`

**Admin vs user control**:
- `draggable: false` → user cannot move the element during customization
- `draggable: true` → user can reposition

---

## TextElement

```typescript
interface TextElement {
  id: string
  type: "text"
  content: string
  position: { x: number; y: number }
  width: number
  height: number
  draggable?: boolean
  zIndex?: number                     // legacy; actual z-index from layer[]
  rotate?: number
  textLimit?: number                  // max character count enforced at edit time
  isSizeLocked?: boolean              // true = width/height/font size frozen outside the admin authoring canvas

  style: {
    fontFamily: string                // must match a name from lib/font.ts fontFamily map
    fontSize: string | number         // stored as "24px" or 24
    fontWeight: string
    color: string
    textAlign: "left" | "center" | "right"
    lineHeight: string
    verticalAlign?: "top" | "middle" | "bottom"

    // Curved text (CSS per-character transforms — NOT SVG textPath; see engine/rendering.md)
    curved?: boolean
    curveRadius?: number              // -100 to 100; negative = curve down, positive = curve up
    curveDirection?: "up" | "down"
    curveIntensity?: number

    // Decoration
    underline?: boolean
    italic?: boolean
    textStroke?: string
    WebkitTextStroke?: string
    outlineWidth?: number
    outlineColor?: string

    // Box styling
    backgroundColor?: string
    borderRadius?: number
    padding?: string | number
    letterSpacing?: string | number

    // Layout
    centerX?: boolean
    centerY?: boolean
    maxWidth?: number | string
  }
}
```

**`textLimit` enforcement**: Enforced by `maxLength={text.textLimit}` on the `<textarea>` in `template-text.tsx` — the browser rejects excess characters at input time. `validateTextElement()` (`src/shared/lib/elements.ts`) does NOT check or truncate against `textLimit`; it normalizes `width`, `height`, `position.x/y`, `padding`, `textAlign`, and `verticalAlign`, and is called by `editor-canvas.tsx` on every content change event.

**Auto-height measurement paths** (two active paths):
1. `template-text.tsx` — a persistent hidden off-screen `<textarea>` (ref-based, `top:-9999px`) has content set on every change; `scrollHeight` is read to update `text.height` in state. Skipped when a `data-resizing` attribute is present on the handle element.
2. `use-resize-text.ts` — during resize, a temporary `<textarea>` is created, appended to `document.body`, measured via `scrollHeight`, then removed.

**Note**: `use-auto-text-height.ts` (which wraps `calculateTextHeight()` from `src/shared/lib/elements.ts`, using canvas `measureText`) is imported in `editor-canvas.tsx` but its `updateTextHeight` return value is never called — it is effectively dead code. → See `risks/debt.md`.

**`isSizeLocked` (size lock)**: when true and `isCustomizing === false` (i.e. outside the admin's own authoring canvas — this covers both the real customer session and the admin's "Test" preview route, which the code cannot currently distinguish), `template-text.tsx` skips both auto-height-to-content and the `getCurvedTextDimensions()` override — `width`/`height` stay exactly as authored. Instead, `calculateShrunkFontSize()` (`src/shared/lib/elements.ts`) shrinks `style.fontSize` down (floored at 8px, matching `use-resize-text.ts`'s existing clamp) so content keeps fitting inside the fixed box; beyond that floor content clips (`overflow: hidden`). Resize handles are also hidden under the same condition. The admin's authoring canvas (`isCustomizing === true`) is always exempt — the admin can freely resize regardless of `isSizeLocked`. The end-user font-size input (`text-editor.tsx`) is disabled when `isSizeLocked` is true, since font size is then fully computed by the auto-shrink engine.

---

## ShapeElement

**Source**: `src/shared/types/element/shape.ts`

```typescript
interface ShapeElement {
  id: string
  type: "shape"
  variant: "rectangle" | "circle" | "triangle"
  width: number
  height: number
  draggable?: boolean
  position: { x: number; y: number }
  rotation: number                    // degrees (note: field name is `rotation` not `rotate`)
  fill: string                        // hex color
  borderColor: string
  borderWidth: number
  borderRadius: number
  opacity: number                     // 0–100
  zIndex: number                      // legacy; actual z-index from layer[]
}
```

---

## LineElement

**Source**: `src/shared/types/element/line.ts`

```typescript
type LineTip = "none" | "arrow" | "circle" | "square" | "rounded"

interface LineElement {
  id: string
  type: "line"
  variant: "line-thin" | "line-medium" | "line-thick" |
           "line-dashed" | "line-dotted" | "line-arrow" | "line-rounded"
  draggable?: boolean
  strokeColor: string
  strokeWidth: number
  opacity: number
  startPoint: { x: number; y: number }  // natural pixel coordinates
  endPoint: { x: number; y: number }    // natural pixel coordinates
  startTip?: LineTip
  endTip?: LineTip
  zIndex?: number                        // legacy; actual z-index from layer[]
}
```

Default configs per variant: `src/features/editor/utils/line-config.ts`

---

## Common Field Rules

| Field | All types | Notes |
|---|---|---|
| `id` | required | UUID generated client-side, appended to `layer[]` on creation |
| `type` | required | discriminant for narrowing |
| `position` | image, text, shape | natural pixels from canvas origin (top-left) |
| `startPoint`/`endPoint` | line only | replaces `position` concept for lines |
| `zIndex` | all | **legacy field, not used for rendering** — actual z-index from `layer[]` |
| `draggable` | all | controls user editability outside the admin authoring canvas (`isCustomizing=false`) |
| `isSizeLocked` | text | freezes width/height/font size outside the admin authoring canvas (`isCustomizing=false`) |

**Note on `isCustomizing`**: despite the name, `isCustomizing={true}` is passed only by `TemplateCreator` (the admin authoring tool, `/editor/create` and `/editor/[id]/edit`). `TemplateEditor` — used by both the real customer session (`/templates/[id]`) and the admin's "Test" preview route (`/editor/[id]`) — never passes it, so it defaults to `false`. Fields meant to be admin-only overrides (`draggable`, `isSizeLocked`) should therefore be gated on `isCustomizing === false`, not `=== true`. → See `flows/order-customization.md`.

**Note on `zIndex` field**: The element-level `zIndex` field is a legacy holdover. The rendering system uses `getLayerIndex(id)` against `template.layer[]`. The element-level field is not authoritative. → See `engine/layers.md`.

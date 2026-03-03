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

  style: {
    fontFamily: string                // must match a name from lib/font.ts fontFamily map
    fontSize: string | number         // stored as "24px" or 24
    fontWeight: string
    color: string
    textAlign: "left" | "center" | "right"
    lineHeight: string
    verticalAlign?: "top" | "middle" | "bottom"

    // Curved text (SVG textPath when true)
    curved?: boolean
    curveRadius?: number
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

`textLimit` is enforced via `validateTextElement()` in `src/shared/lib/elements.ts`.
Auto-height growth: `src/features/editor/hooks/use-auto-text-height.ts` uses `calculateTextHeight()` (canvas `measureText`) on every content change.

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
| `draggable` | all | controls user editability in `isCustomizing=true` mode |

**Note on `zIndex` field**: The element-level `zIndex` field is a legacy holdover. The rendering system uses `getLayerIndex(id)` against `template.layer[]`. The element-level field is not authoritative. → See `engine/layers.md`.

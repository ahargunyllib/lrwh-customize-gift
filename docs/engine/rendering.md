# Engine: Element Rendering

**Source**: `src/features/editor/components/template-elements/`
**Related**: → `engine/canvas.md` (scale factor) · → `engine/layers.md` (z-index) · → `entities/elements.md` (type definitions)

All rendering is **pure HTML/CSS/DOM** — no canvas library (no Fabric.js, no Konva).
Server renders nothing — all element rendering is client-side React.

---

## ImageElement Rendering

```tsx
// template-image.tsx (inferred structure):
<div                                    // FRAME div
  style={{
    position: "absolute",
    left: position.x * scale,
    top: position.y * scale,
    width: width * scale,
    height: height * scale,
    transform: `rotate(${rotate ?? 0}deg)`,
    borderRadius: borderRadius * scale,
    overflow: "hidden",                 // clips img to frame bounds
    zIndex: getLayerIndex(id),          // from layer[] array, NOT element.zIndex
  }}
>
  <img
    src={src}
    style={{
      transform: `translate(${imageOffset.x * scale}px, ${imageOffset.y * scale}px)
                  scale(${scaleX ?? 1}, ${scaleY ?? 1})`,
      // CSS filter for display grayscale (bypassed during export — see engine/export.md)
      filter: grayscale ? `grayscale(${grayscalePercent}%)` : "none",
    }}
  />
  {/* Resize handles rendered when element is active */}
</div>
```

**Cropping**: `overflow: hidden` on the frame + CSS translate/scale on `img`.
No `clip-path` or SVG mask — this is pan+zoom-within-frame.

**Grayscale display vs export**: CSS `filter: grayscale()` for display. Before export, `prepareCanvasForExport()` replaces `img.src` with a pixel-processed grayscale data URL. → `engine/export.md`

---

## TextElement Rendering

```tsx
// template-text.tsx:
<div
  style={{
    position: "absolute",
    left: position.x * scale,
    top: position.y * scale,
    width: width * scale,
    height: height * scale,
    transform: `rotate(${rotate ?? 0}deg)`,
    zIndex: getLayerIndex(id),
  }}
>
  {editingTextId === id
    ? <textarea ... />                  // inline editing mode
    : <div style={{ ...style, fontSize: style.fontSize * scale }} />
  }
</div>
```

### Curved Text
When `style.curved = true`, renders as SVG `<textPath>` on an arc:
```tsx
<svg>
  <defs>
    <path id="curve" d={arcPath(curveRadius, curveDirection)} />
  </defs>
  <text>
    <textPath href="#curve">{content}</textPath>
  </text>
</svg>
```

### Text Height Auto-Grow
`useAutoTextHeight` hook: on every `content` change, calls `calculateTextHeight()`:
```typescript
// lib/elements.ts:
function calculateTextHeight(text, style, width): number {
  const ctx = document.createElement("canvas").getContext("2d")
  ctx.font = `${style.fontSize}px ${style.fontFamily}`
  // word-wrap simulation via measureText()
  // returns pixel height in natural space
}
```
Creates a new canvas element on every call. No persistent canvas reference.

### Text Editing
`editingTextId` state in `useTemplateEditor` controls which text is in edit mode.
Double-click activates; click elsewhere deactivates.
`textLimit` enforced in `validateTextElement()` → `lib/elements.ts`.

---

## ShapeElement Rendering

```tsx
// template-shape.tsx:
// rectangle: styled div with borderRadius
// circle: div with borderRadius: 50%
// triangle: CSS border trick or SVG path
<div
  style={{
    position: "absolute",
    left: position.x * scale,
    top: position.y * scale,
    width: width * scale,
    height: height * scale,
    transform: `rotate(${rotation}deg)`,   // note: field is `rotation`, not `rotate`
    background: fill,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: borderRadius,
    opacity: opacity / 100,                // stored 0–100, CSS wants 0–1
    zIndex: getLayerIndex(id),
  }}
/>
```

---

## LineElement Rendering

Lines render as SVG elements:

```tsx
// template-line.tsx:
<svg
  style={{ position: "absolute", overflow: "visible", zIndex: getLayerIndex(id) }}
>
  <line
    x1={startPoint.x * scale}
    y1={startPoint.y * scale}
    x2={endPoint.x * scale}
    y2={endPoint.y * scale}
    stroke={strokeColor}
    strokeWidth={strokeWidth * scale}
    strokeDasharray={dashPattern[variant]}
    opacity={opacity / 100}
  />
  {/* SVG markers for startTip / endTip */}
</svg>
```

`variant` maps to stroke style via `src/features/editor/utils/line-config.ts`.

---

## Interaction Hooks

| Hook | Handles |
|---|---|
| `use-element-drag.ts` | mousedown → dispatches `elementMove` custom DOM event |
| `use-element-move.ts` | listens for `elementMove` → calls `updateElement()` |
| `use-resize-image.ts` | 8-direction resize handles (corner = constrained aspect ratio) |
| `use-resize-text.ts` | text box resize |
| `use-adjust-image.ts` | pan image within frame (custom `imageAdjust` DOM event) |
| `use-image-replace.ts` | swap `src` of existing image |
| `use-line-transform.ts` | drag start/end points of line |

**Custom event system**: Drag uses `document.dispatchEvent(new CustomEvent("elementMove"))` rather than React state. This bypasses React's event system for performance during high-frequency mousemove. Cleanup is in `useEffect` return callbacks.

---

## Active Element Selection

`activeElement` state in `useTemplateEditor`:
```typescript
type ActiveElement = { id: string; type: "image" | "text" | "shape" | "line" } | null
```

Clicking outside all elements: `setActiveElement(null)` via canvas background click.
Only one element can be active at a time.

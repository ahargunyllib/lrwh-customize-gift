# Engine: Canvas Coordinate System

**Source**: `src/features/editor/hooks/use-canvas-scale.ts`, `src/features/editor/components/editor-canvas.tsx`
**Related**: → `engine/rendering.md` (how scale is applied) · → `entities/elements.md` (position fields) · → `engine/layers.md` (z-index)

---

## Coordinate Space

```
Canvas origin (0, 0) = top-left corner of the canvas div

X increases →
Y increases ↓

All element positions stored in NATURAL PIXEL SPACE (unscaled).
Scale is applied at render time via CSS transform.
```

Values in `TemplateData` (DB): **always natural pixels**.
Values in DOM (rendered): **natural pixels × scale**.

---

## Scale Factor

The canvas is displayed inside a container whose width varies by viewport. The `scale` factor fits the canvas into the available space.

```typescript
// use-canvas-scale.ts:
scale = containerWidth / template.width
```

The canvas `div` uses CSS transform to visually scale without changing the DOM dimensions:

```tsx
// editor-canvas.tsx:
<div
  style={{
    width: template.width * scale,    // visual size = natural size * scale
    height: template.height * scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  }}
/>
```

**Note on double-sizing**: The DOM element is set to `width * scale` pixels AND then `scale()` is applied. For `scale < 1`, the element is made smaller first, then scaled down again — this effectively halves the rendered element relative to what `transform: scale()` alone would produce. This is the current implementation; it is not optimal but it is what exists.

---

## Pixel Conversion

### Storage → DOM
```
dom_x = stored_x * scale
dom_y = stored_y * scale
dom_width = stored_width * scale
dom_height = stored_height * scale
dom_fontSize = stored_fontSize * scale
```

### DOM → Storage (event coordinates)
```
stored_x = event_clientX / scale
stored_y = event_clientY / scale
```

Mouse events return coordinates in CSS pixels. Dividing by `scale` converts back to natural pixel space before updating state.

---

## Zoom (Manual Override)

`useCanvasZoom` allows users to manually override the auto-scale:

```typescript
// use-canvas-zoom.ts:
const zoomIn = () => setScale(prev => prev * 1.2)
const zoomOut = () => setScale(prev => prev / 1.2)
const resetZoom = () => setScale(autoScale)  // resets to container-fitted value
```

Manual zoom changes the `scale` state. All element positions remain unchanged (natural pixels) — only the display transform changes.

---

## Canvas Pan (Gesture)

`useCanvasGesture` tracks two-finger pan on touch/trackpad:

```typescript
// use-canvas-gesture.ts:
// Adjusts a canvasOffset state {x, y}
// Applied as translateX/translateY on the canvas container
```

Pan offset is display-only. Element coordinates are not affected.

---

## Alignment Snapping

`useAlignmentGuides` computes snap positions during drag:

```typescript
// Snap targets:
// - Canvas center X and Y
// - Edges (left/right/top/bottom) of other elements
// - Canvas boundary edges

getSnapPosition(x, y): { x, y }     // returns snapped coordinates if within threshold
constrainToCanvas(x, y, w, h)       // clamps position to keep element within canvas
```

Snap coordinates are in natural pixel space.

---

## Scale Application by Element Type

| Element field | Applied scale |
|---|---|
| `position.x`, `position.y` | `* scale` |
| `width`, `height` | `* scale` |
| `rotate`, `rotation` | no scale (degrees) |
| `fontSize` | `* scale` |
| `borderRadius` | `* scale` |
| `imageOffset.x`, `imageOffset.y` | `* scale` |
| `strokeWidth` | `* scale` |
| `startPoint`, `endPoint` | `* scale` |

**Exception**: `opacity` (0–100) and color values are never scaled.

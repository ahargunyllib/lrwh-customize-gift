# Engine: Element Rendering

**Source**: `src/features/editor/components/template-elements/`
**Related**: → `engine/canvas.md` (scale factor) · → `engine/layers.md` (z-index) · → `entities/elements.md` (type definitions)

All rendering is **pure HTML/CSS/DOM** — no canvas library (no Fabric.js, no Konva).
Server renders nothing — all element rendering is client-side React.

---

## ImageElement Rendering

```tsx
// template-image.tsx:
<>
  {/* OUTER CONTAINER — position, size, rotation, z-index, canvas clip */}
  <div
    ref={dropZoneRef}
    className="absolute overflow-hidden"
    style={{
      left: image.position.x * scale,       // overridden if centerX is set
      top: image.position.y * scale,        // overridden if centerY is set
      width: image.width * scale,
      height: image.height * scale,
      transform: `rotate(${image.rotate ?? 0}deg)`,
      transformOrigin: "center center",
      zIndex: layerIndex,                   // passed as prop from parent (layer[].indexOf)
      // clipPath only applied when rotate === 0 to avoid incorrect clipping:
      clipPath: shouldClip ? `inset(${top}% ${right}% ${bottom}% ${left}%)` : undefined,
    }}
    onDrop={handleDrop}                     // file drop → dispatches "imageReplace" event
    onMouseDown={handleMouseDown}           // drag → only if image.draggable === true
  >
    {/* INNER div for borderRadius clipping */}
    <div className="w-full h-full overflow-hidden" style={{ borderRadius: image.borderRadius ?? 0 }}>
      <img
        src={image.src}
        style={{
          width: originalDimensions?.width || "auto",   // natural pixel size
          height: originalDimensions?.height || "auto",
          maxWidth: "none",
          maxHeight: "none",
          transformOrigin: "0 0",
          transform: `translate(${imageOffset.x * scale}px, ${imageOffset.y * scale}px)
                      scale(${scaleX * scale}, ${scaleY * scale})`,
          filter: image.grayscalePercent ? `grayscale(${image.grayscalePercent}%)` : "none",
        }}
        onLoad={handleImageLoad}            // dispatches "imageAdjust" to set initial cover scale
      />
    </div>
    {/* Resize handles (8-direction) — visible when isActive && isCustomizing */}
  </div>

  {/* CropModal — rendered outside container as overlay */}
  {isCropMode && <CropModal ... />}
</>
```

**Centering override**: If `image.centerX` is set, `left` is overridden to `((canvasWidth - image.width) / 2) * scale`. Same for `centerY`.

**Canvas boundary clipping**: Uses `clipPath: inset()` on the outer container (not overflow:hidden) so elements can extend outside the frame without overflow issues. Only applied when `rotate === 0`.

**Cropping within frame**: `overflow: hidden` on the inner div + CSS `translate/scale` on `<img>`. The img is rendered at its natural pixel size (`originalDimensions.width × height`) and repositioned via transform. `transformOrigin: "0 0"` means scale anchors at the img's top-left.

**Initial image fit**: On `onLoad`, `handleImageLoad` dispatches `imageAdjust` custom event to set `scaleX/scaleY/imageOffset` such that the image fills the frame (background-size: cover behavior).

**Drag-and-drop replacement**: Drop a file onto an image element → reads as DataURL → dispatches `imageReplace` custom event: `{ id, src: dataURL }`.

**Dragging**: Only active when `image.draggable === true`. Dispatches `elementMove` custom event with new position in natural pixels.

**Grayscale display vs export**: CSS `filter: grayscale()` for display. Before export, `prepareCanvasForExport()` replaces `img.src` with a pixel-processed grayscale data URL. → `engine/export.md`

---

## TextElement Rendering

```tsx
// template-text.tsx:
<>
  {/* Hidden off-screen textarea for height measurement */}
  <textarea ref={hiddenTextareaRef} style={{ position: "absolute", top: "-9999px", ... }} readOnly />

  {/* CONTAINER — position, size, rotation, active border, z-index, canvas clip */}
  <div
    ref={textRef}
    style={{
      position: "absolute",
      left: (text.position.x || 0) * scale,
      top: (text.position.y || 0) * scale,
      width: curvedDimensions.width * scale,    // getCurvedTextDimensions() for curved, text.width for flat
      height: curvedDimensions.height * scale,
      transform: `rotate(${text.rotate}deg)`,
      transformOrigin: "center center",
      backgroundColor: style.backgroundColor || "transparent",
      borderRadius: (style.borderRadius || 0) * scale,
      border: isActive ? `${2 * scale}px solid #3b82f6` : `${2 * scale}px solid transparent`,
      zIndex: layerIndex,                       // passed as prop from parent (layer[].indexOf)
      clipPath: shouldClip ? getClipPath() : undefined,  // canvas boundary; only when rotate===0
    }}
    onMouseDown={handleMouseDown}               // drag → only if text.draggable && !isEditing
  >
    {isEditing
      ? <textarea ref={textareaRef} value={text.content} maxLength={text.textLimit} />
      : curved && curveRadius !== 0
        ? renderCurvedText()
        : <div style={getDisplayStyle()}>{text.content}</div>
    }
    {/* Resize handles (8-direction) — visible when isActive && !isEditing */}
  </div>
</>
```

### Curved Text
When `style.curved = true` and `style.curveRadius !== 0`, renders per-character using CSS transforms (NOT SVG `<textPath>`):

```tsx
// template-text.tsx — renderCurvedText():
{chars.map((char, index) => {
  const { x, y, rotation } = calculateCharTransform(index, chars.length, curveRadius, curveDirection)
  return (
    <span
      key={...}
      style={{
        position: "absolute",
        left: `${centerX * scale}px`,   // centered in the element
        top: `${centerY * scale}px`,
        transform: `translate(${x * scale}px, ${y * scale}px) rotate(${rotation}deg) translate(-50%, -50%)`,
        transformOrigin: "center center",
        fontSize: fontSizeNum * scale,
        // other text style props...
      }}
    >
      {char}
    </span>
  )
})}
```

**Curve math** (`calculateCharTransform`):
- `curveRadius` range: **-100 to 100** (negative = curve down, positive = curve up)
- Mapped to a circle radius: `r = 500 - 400 * (|curveRadius| / 100) ^ 0.7` → range `[100, 500]`
- Characters placed along arc: `startAngle = -angleSpan / 2`, each char at `startAngle + anglePerChar * i`
- `directionMultiplier = curveRadius > 0 ? 1 : -1` (sign of y-offset determines up/down)

**Container for curved text**: `getCurvedTextDimensions()` computes a bounding box large enough for the arc span, overriding `text.width/height`.

### Text Height Auto-Grow
Done inside `template-text.tsx` using a **hidden off-screen `<textarea>`** (not a separate hook or `lib/elements.ts`):

```tsx
// Hidden textarea positioned at top:-9999px left:-9999px:
<textarea ref={hiddenTextareaRef} style={{ width: text.width * scale }} readOnly />

// updateHeightFromTextarea(content):
hiddenTextarea.value = content
hiddenTextarea.style.height = "auto"
const newHeight = hiddenTextarea.scrollHeight   // browser does the wrapping math
setTemplate(prev => ({
  ...prev,
  texts: prev.texts.map(t => t.id === text.id ? { ...t, height: newHeight + padding*2 } : t)
}))
```

Triggered by `useEffect` on `[text.content, text.width, fontSizeNum, text.style.lineHeight, ...]`.
**Skipped when resizing**: checks for `document.querySelector('[data-resizing="${text.id}"]')` attribute — a resize handle sets `data-resizing` on `mousedown` and removes it on `mouseup`.

**Skipped when size-locked**: if `text.isSizeLocked && !isCustomizing`, `updateHeightFromTextarea` takes a different branch entirely — it never touches `width`/`height` (flat or curved), and instead calls `calculateShrunkFontSize()` (`src/shared/lib/elements.ts`) to shrink `style.fontSize` down (floored at 8px) until `content` fits the existing fixed box. A `baseFontSizeRef`, updated only while `isCustomizing` is true, remembers the admin-authored font size so the box can grow the font back toward it as content shortens. Resize handles (`template-text.tsx`, gated at `isActive && !isEditing && !(text.isSizeLocked && !isCustomizing)`) are hidden under the same condition. The admin's own authoring canvas (`isCustomizing=true`) is exempt from all of this — see the `isCustomizing` naming caveat in `entities/elements.md`.

### Text Editing
`isEditing` is passed as a **prop** to `TemplateText` (not tracked inside `useTemplateEditor`). The parent container manages `editingTextId` state.
Double-click activates edit mode. Clicking outside deactivates.
`textLimit` enforced via `maxLength={text.textLimit}` on the `<textarea>`.

### Additional Text Style Fields (not in basic docs)
| Field | Effect |
|---|---|
| `style.italic` | `fontStyle: "italic"` |
| `style.underline` | `textDecoration: "underline"` |
| `style.letterSpacing` | Scaled by `scale` factor in px |
| `style.backgroundColor` | Applied to container div |
| `style.borderRadius` | Applied to container div, scaled |
| `style.padding` | Used in height calculation, not applied as CSS directly |
| `style.textStroke` / `style.WebkitTextStroke` | Applied to individual chars in curved mode; commented out in flat mode |

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

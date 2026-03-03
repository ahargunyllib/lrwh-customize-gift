# Template Engine

## Overview

The template engine is a **pure HTML/CSS/DOM-based rendering system** with no canvas library (no Fabric.js, no Konva, no Paper.js). Templates are rendered as absolutely-positioned HTML elements inside a `div` container. Export to PNG is performed by `html2canvas-pro` which re-renders the DOM off-screen.

---

## Template Data Structure (JSON Schema)

Templates are stored in PostgreSQL as a JSON blob in `templates.data`. The full runtime type is `TemplateData` (`src/shared/types/template.ts`).

```typescript
// Stored in DB (data column):
{
  width: number,             // canvas width in pixels
  height: number,            // canvas height in pixels
  backgroundColor: string,   // CSS color (e.g. "#ffffff")
  backgroundImage?: string,  // URL or data URL
  images: ImageElement[],
  texts: TextElement[],
  shapes: ShapeElement[],
  lines: LineElement[],
  layer: string[]            // element IDs ordered bottom-to-top
}

// Reconstructed at runtime (adds top-level fields):
{
  id: string,               // template UUID
  name: string,
  productVariantId?: string,
  previewUrl: string | null,
  previewFile: File | null, // client-only
  ...above
}
```

---

## Coordinate System

- **Origin**: Top-left corner of the canvas `div`
- **Unit**: Pixels
- **Positioning**: CSS `position: absolute`, `left: x * scale`, `top: y * scale`
- **Scale**: All coordinates are stored in **natural pixel space**. The scale factor is applied at render time via CSS transform.

```
Canvas (width × height pixels)
  (0,0) ──────────────────────── (width, 0)
    │                                 │
    │   Elements: absolute x, y       │
    │                                 │
  (0, height) ──────────────── (width, height)
```

---

## Scaling System

The canvas is scaled using CSS transform on the container `div`:

```tsx
// EditorCanvas.tsx
<div
  style={{
    width: template.width * scale,
    height: template.height * scale,
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  }}
/>
```

The `scale` factor is computed by `useCanvasScale` hook based on available container width.

All element positions and dimensions in the DB are stored **unscaled** (in natural pixels). At render time, every pixel value is multiplied by `scale`:

```tsx
// TemplateImage example:
style={{
  left: image.position.x * scale,
  top: image.position.y * scale,
  width: image.width * scale,
  height: image.height * scale,
}}
```

Interaction coordinates (mouse events) are divided by `scale` to convert back to natural space before updating state.

---

## Layer Stacking (Z-index)

The `template.layer` array defines the rendering order:

```
layer = ["id-A", "id-B", "id-C"]
                               └── highest (front)
         └── lowest (back)
```

`getLayerIndex(id)` returns the array index, which is used as CSS `z-index`.

Layer operations (in `useTemplateEditor`):
- `bringForwardLayer(id)` — swap with next in layer array
- `sendBackwardLayer(id)` — swap with previous in layer array
- `bringToFrontLayer(id)` — move to end of layer array
- `sendToBackLayer(id)` — move to start of layer array

**Note**: There are also legacy `bringForward`/`sendBackward` functions that operated on the combined `getAllElements()` array (images + texts) using array order. These are superseded by the `layer` array system but both exist in `useTemplateEditor`.

---

## Element Rendering

### ImageElement Rendering

```tsx
// template-image.tsx (inferred from structure)
<div
  style={{
    position: "absolute",
    left: image.position.x * scale,
    top: image.position.y * scale,
    width: image.width * scale,
    height: image.height * scale,
    transform: `rotate(${image.rotate ?? 0}deg)`,
    borderRadius: image.borderRadius * scale,
    overflow: "hidden",       // clips image to frame
    zIndex: layerIndex,
    filter: image.grayscale ? `grayscale(${image.grayscalePercent}%)` : "none",
  }}
>
  <img
    src={image.src}
    style={{
      transform: `translate(${imageOffset.x * scale}px, ${imageOffset.y * scale}px) scale(${scaleX}, ${scaleY})`,
      // Image panned and scaled within the frame
    }}
  />
  {/* Resize handles (8 directions) when active */}
</div>
```

**Image cropping**: Implemented via `overflow: hidden` on the frame div + CSS transform on the `img` element (translate for pan, scale for zoom within frame).

**Grayscale**: Applied two ways:
1. CSS `filter: grayscale()` at render time (for display)
2. Canvas pixel manipulation via `applyGrayscaleToImage()` before export (to bypass html2canvas filter limitations)

### TextElement Rendering

```tsx
// template-text.tsx
<div
  style={{
    position: "absolute",
    left: text.position.x * scale,
    top: text.position.y * scale,
    width: text.width * scale,
    height: text.height * scale,
    transform: `rotate(${text.rotate ?? 0}deg)`,
    zIndex: layerIndex,
  }}
>
  {/* When editing: <textarea contentEditable> */}
  {/* When not editing: rendered text with all styles */}
  <div
    style={{
      fontFamily: text.style.fontFamily,
      fontSize: `${fontSize * scale}px`,
      fontWeight: text.style.fontWeight,
      color: text.style.color,
      textAlign: text.style.textAlign,
      lineHeight: text.style.lineHeight,
      letterSpacing: text.style.letterSpacing,
      WebkitTextStroke: text.style.WebkitTextStroke,
      // ... all style fields
    }}
  />
</div>
```

**Curved text**: When `style.curved=true`, text is rendered using SVG `textPath` on an arc.

**Auto-height**: `useAutoTextHeight` hook measures text via `calculateTextHeight()` (uses `canvas.measureText()`) and auto-expands the text box height.

**Text editing**: Double-clicking activates inline editing (`editingTextId` state), rendering a `<textarea>` or `contenteditable` div.

### ShapeElement Rendering

Shapes are rendered as styled `div` elements:
- `rectangle`: plain div with `borderRadius`
- `circle`: div with `borderRadius: 50%`
- `triangle`: CSS border trick or SVG

### LineElement Rendering

Lines are rendered as SVG elements with:
- `startPoint` and `endPoint` defining the line in canvas coordinates
- Stroke style determined by `variant` (thin, medium, thick, dashed, dotted, arrow, rounded)
- Tip arrows/circles rendered as SVG markers or additional path elements

---

## Alignment Guides (Snapping)

**Hook**: `useAlignmentGuides` (`src/features/editor/hooks/use-allignment-guides.ts`)

When dragging an element, the hook calculates snap positions relative to:
- Canvas center (both axes)
- Edges of other elements
- Canvas boundaries

`getSnapPosition(x, y)` returns snapped coordinates if within snap threshold.
`constrainToCanvas(x, y, w, h)` prevents elements from being dragged outside canvas bounds.

Visual guides are rendered by `AlignmentGuides` component as thin lines at snap positions.

---

## Ruler System

**Hook**: `useRulerGuides` — manages a list of guide objects `{id, orientation, position}`.

**Component**: `RulerSystem` — renders horizontal + vertical ruler bars with tick marks.
- Guides are draggable from the ruler into the canvas.
- `GuidesOverlay` renders guide lines on the canvas.
- Guides are visual-only — they do not affect snapping or export.

---

## Rendering Algorithm (Step-by-Step)

### Admin Editor Flow

```
1. TemplateCreator mounts
   └── useTemplateEditor() initializes blank TemplateData (default 400×800px)

2. Admin selects ProductVariant
   └── Template width/height set from variant.width/height
   └── Template re-initialized or scaled

3. Admin adds element (e.g., addImage())
   └── New ImageElement created with UUID, default position (canvas center)
   └── ID appended to template.layer[]
   └── Element appended to template.images[]

4. Admin drags element
   └── mousedown on element → useElementDrag.handleMouseDown()
   └── mousemove → dispatches custom "elementMove" event
   └── useElementMove listens for event → updates template state

5. Admin resizes element
   └── mousedown on resize handle → useResizeImage.handleResizeStart()
   └── mousemove → recalculates width/height/position
   └── Maintains aspect ratio on corner handles (unless Shift held)

6. Admin rotates element
   └── Unknown from codebase (rotation input in sidebar likely)

7. Admin clicks Save
   └── useTemplatePersistence.save(template)
   └── createTemplate() or updateTemplate() Server Action
   └── Preview PNG optionally generated by html2canvas-pro first
   └── JSON stored in DB
```

### User Customization Flow

```
1. TemplateEditor mounts with isCustomizing=true
   └── EditorCanvas useEffect: initialTemplate provided → setTemplate(initialTemplate)
   └── OR: blank slate created if no initialTemplate

2. User drops image onto canvas
   └── useCanvasDrop.handleCanvasDrop()
   └── FileReader reads file as data URL
   └── New ImageElement added to template.images[]

3. User adjusts image (pan within frame)
   └── "imageAdjust" custom event dispatched
   └── useImageAdjust updates imageOffset

4. User edits text
   └── Double-click activates textarea (editingTextId set)
   └── validateTextElement() enforces constraints on change
   └── textLimit enforced if set

5. User submits
   └── prepareCanvasForExport(canvasRef, template)
   │   ├── Find grayscale images in DOM
   │   ├── Apply pixel-level grayscale via canvas API
   │   └── Replace img.src with grayscale data URL
   └── html2canvas(canvasRef.current, { scale: 1 }) → canvas element
   └── canvas.toDataURL("image/png") → data URL string
   └── submitOrder({ orderId, templates: [{orderProductVariantId, dataURL}] })
   └── cleanup: restore original img.src values
```

---

## Aspect Ratio Rules

- **Canvas**: Fixed at `productVariant.width × productVariant.height`
- **Images**: Frame dimensions are set independently (no forced aspect ratio). When resizing via corner handles, aspect ratio is maintained by default; hold `Shift` to override.
- **Shapes**: No automatic aspect ratio enforcement detected.
- **Lines**: Start/end point driven; no aspect ratio concept.

---

## Cropping Implementation

Image cropping is achieved via:
1. A fixed-size `div` frame with `overflow: hidden`
2. The `<img>` inside is scaled and offset via CSS `transform: translate() scale()`
3. `imageOffset` stores the pan offset
4. `scaleX` / `scaleY` store the zoom within the frame

There is no crop mask or clip-path used. This is a pan+zoom-within-frame approach, not a true crop.

---

## Template Scaling (Different Print Sizes)

**Function**: `getTemplateForSize(template, {width, height})` in `src/shared/lib/template.ts`

Scales all element positions and sizes proportionally:
```typescript
const scaleX = newWidth / template.width
const scaleY = newHeight / template.height

// Images: position * scaleX/Y, size * scaleX/Y
// Texts: position * scaleX/Y, fontSize * min(scaleX, scaleY)
// Shapes: position * scaleX/Y, size * scaleX/Y
// Lines: startPoint/endPoint * scaleX/Y
```

**Note**: The print size feature appears to be **commented out** in the codebase (see commented `printSizes` array and `changePrintSize` implementation in `useTemplateEditor`). It is not currently active.

---

## Export Process

```
Client-side:
1. prepareCanvasForExport(canvasRef, template)
   - Processes grayscale images via canvas pixel manipulation
   - Returns cleanup function

2. html2canvas(canvasRef.current, options) → HTMLCanvasElement
   - Captures the full DOM canvas element as pixels
   - Note: custom fonts must be loaded before capture

3. canvas.toDataURL("image/png") → data URL string

Server-side (submitOrder):
4. parseDataUrl(dataURL) → { mime, base64 }
5. Validate: mime === "image/png" && PNG magic bytes match
6. Validate: decoded size ≤ 8MB
7. uploadBufferToS3(buffer, key) where key includes sha256 hash
8. Update order_product_variants.image_url
```

---

## Server-Side vs Client-Side Rendering

| Operation | Where | Library |
|---|---|---|
| Template editing (all) | Client | React state + DOM |
| Element drag | Client | Custom event system + DOM |
| Element resize | Client | Mouse events + React state |
| Text height calculation | Client | `canvas.measureText()` |
| Grayscale processing | Client | `canvas` pixel manipulation |
| Export to PNG | Client | `html2canvas-pro` |
| Template storage | Server | Drizzle ORM → PostgreSQL |
| Image upload (preview) | Server | AWS S3 SDK |
| Image upload (order) | Server | AWS S3 SDK |

**There is no server-side image rendering.** The server never generates or processes images beyond validating and proxying them.

---

## Known Limitations

1. **Font loading for export**: html2canvas-pro may not capture custom fonts correctly if the fonts haven't fully loaded in the browser when the capture happens. No explicit font-loading wait detected before export.

2. **CSS filter for grayscale**: CSS `filter: grayscale()` is not reliably captured by html2canvas. The system works around this by pre-processing images via canvas pixel manipulation before export (`prepareCanvasForExport`).

3. **Large data URLs**: The body size limit for Server Actions is set to 100MB to accommodate base64-encoded PNGs. However, the server validates actual decoded size at ≤ 8MB.

4. **No server-side rendering of templates**: Preview images must be generated client-side and uploaded. If the admin doesn't generate a preview, `previewUrl` remains null.

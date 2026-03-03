# Engine: Layer System

**Source**: `src/features/editor/hooks/use-template-editor.ts`
**Related**: → `entities/template.md` (layer[] in TemplateData) · → `entities/elements.md` (legacy zIndex field)

---

## Data Model

`template.layer` is a flat ordered array of element IDs:

```typescript
layer: string[]   // ["id-A", "id-B", "id-C"]
                  //   back ──────────── front
```

Index 0 = bottom (lowest z-index). Last index = top (highest z-index).

`getLayerIndex(id)` returns the array index, used directly as CSS `zIndex`.

**Authoritative source**: `layer[]` is the ONLY source of truth for z-index. The `zIndex` field stored on each element object is a legacy holdover and is not used for rendering.

---

## Layer Operations

All defined in `use-template-editor.ts`:

```typescript
bringForwardLayer(id)    // swap element with next in array (move forward one step)
sendBackwardLayer(id)    // swap element with previous (move back one step)
bringToFrontLayer(id)    // move to end of array
sendToBackLayer(id)      // move to start of array
```

**Legacy operations (dead code)**:
```typescript
bringForward(id)    // operates on getAllElements() sort order, not layer[]
sendBackward(id)    // same — bypasses layer[] entirely
bringToFront(id)    // same
sendToBack(id)      // same
```

Both sets are exported from `useTemplateEditor`. Only the `layer`-based set affects rendering. The legacy set may have been used before the `layer[]` system was added. → See `risks/debt.md`.

---

## Adding Elements

Every `add*()` function in `useTemplateEditor` must append to `layer[]`:

```typescript
// Example from addImage():
setTemplate(prev => ({
  ...prev,
  images: [...prev.images, newImage],
  layer: [...prev.layer, newImage.id],   // REQUIRED — without this, renders at z-index 0
}))
```

**Invariant**: An element's ID must be in `layer[]` before it renders with correct z-index.

---

## Known Bug: Delete Does Not Clean layer[]

```typescript
// deleteElement() in use-template-editor.ts — BUGGY:
setTemplate(prev => ({
  ...prev,
  images: prev.images.filter(img => img.id !== id),   // removes from images[]
  texts: prev.texts.filter(t => t.id !== id),          // removes from texts[]
  // layer[] is NOT updated — stale ID remains
}))
```

**Effect**: After deleting an element, its ID stays in `layer[]`. `getLayerIndex(deletedId)` will return a valid index until the stale entry is overwritten. Elements added after deletion may receive an unexpectedly high z-index.

**Workaround when fixing**: Add `layer: prev.layer.filter(id => id !== elementId)` to all delete calls.

---

## getLayerIndex Implementation

```typescript
// Inside EditorCanvas or useTemplateEditor:
const getLayerIndex = (id: string): number => {
  const idx = template.layer.indexOf(id)
  return idx === -1 ? 0 : idx    // unknown IDs default to 0 (behind everything)
}
```

O(n) per call, called once per element per render. For large templates (30+ elements), this is 30+ `indexOf` calls per render cycle. A Map lookup would be O(1).

---

## Rendering Order in EditorCanvas

Elements are rendered by iterating their typed arrays:

```tsx
// editor-canvas.tsx:
{template.images.map(img => (
  <TemplateImage key={img.id} ... zIndex={getLayerIndex(img.id)} />
))}
{template.texts.map(text => (
  <TemplateText key={text.id} ... zIndex={getLayerIndex(text.id)} />
))}
{template.shapes.map(shape => (
  <TemplateShape key={shape.id} ... zIndex={getLayerIndex(shape.id)} />
))}
{template.lines.map(line => (
  <TemplateLine key={line.id} ... zIndex={getLayerIndex(line.id)} />
))}
```

Elements of different types can interleave in z-order because CSS `z-index` is assigned from `layer[]`, not from render order.

# Knowledge Base Index

## Knowledge Graph

```
entities/ ──── engine/ ──── flows/
    │               │           │
    └───── contracts/ ──── infra/
                    │
                 risks/
```

**Rule**: Load by task type, not by feature. Each file is a single coherent concept ≤ 250 lines.

---

## Load Map — Files Per Task

| Task | Load These Files |
|---|---|
| Add new element type to canvas | `entities/elements.md` · `engine/canvas.md` · `engine/rendering.md` · `engine/layers.md` |
| Modify template JSON structure | `entities/template.md` · `infra/database.md` · `contracts/server-actions.md` |
| Fix/extend order submission | `flows/order-customization.md` · `entities/order.md` · `contracts/validation.md` |
| Fix auth / session / login | `flows/auth.md` · `contracts/middleware.md` · `risks/security.md` |
| Add admin dashboard page | `entities/product-user.md` · `contracts/middleware.md` · `contracts/server-actions.md` |
| Modify export (PNG capture) | `engine/export.md` · `flows/order-customization.md` · `contracts/validation.md` |
| Understand layer z-index system | `engine/layers.md` · `entities/template.md` |
| Debug S3 / file upload | `infra/storage.md` · `contracts/server-actions.md` · `risks/security.md` |
| Investigate fragile code | `risks/fragile.md` · `risks/security.md` |
| Add new product / variant | `entities/product-user.md` · `contracts/server-actions.md` · `infra/database.md` |
| Understand full system at once | `INDEX.md` · `flows/template-authoring.md` · `flows/order-customization.md` · `flows/auth.md` |

---

## Knowledge Units

### `entities/` — Data Shape Definitions

| File | Concept | Key Types |
|---|---|---|
| `entities/template.md` | TemplateData JSON schema, layer[] invariant | `TemplateData` |
| `entities/elements.md` | Canvas element types | `ImageElement` `TextElement` `ShapeElement` `LineElement` |
| `entities/order.md` | Order state machine, photo slot model | `Order` `OrderProductVariant` |
| `entities/product-user.md` | Product/variant canvas dimensions, roles | `Product` `ProductVariant` `User` `AuditLog` |

### `engine/` — Canvas Rendering System

| File | Concept | Source |
|---|---|---|
| `engine/canvas.md` | Coordinate space, scale factor, pixel math | `use-canvas-scale.ts` |
| `engine/rendering.md` | Per-element HTML/CSS rendering rules | `template-elements/` |
| `engine/layers.md` | layer[] z-index system, stacking ops, **delete bug** | `use-template-editor.ts` |
| `engine/export.md` | Grayscale preprocessing → html2canvas → data URL | `lib/elements.ts` |

### `flows/` — Ordered Operation Sequences

| File | Concept | Entry Point |
|---|---|---|
| `flows/template-authoring.md` | Admin create/edit/save template | `/editor/create` |
| `flows/order-customization.md` | User verify → select → customize → submit | `/templates/onboarding` |
| `flows/auth.md` | Login → JWT → session → middleware guards | `/login` |

### `contracts/` — Signatures, Rules, Enforcement

| File | Concept | Source |
|---|---|---|
| `contracts/server-actions.md` | All Server Actions: auth, returns, DB/S3 effects | `shared/repository/*/action.ts` |
| `contracts/validation.md` | Zod schemas, file rules, business constraints | `shared/repository/*/dto.ts` |
| `contracts/middleware.md` | Guard pipeline, PROTECTED_ROUTES, role→tab map | `src/middlewares/` |

### `infra/` — Infrastructure

| File | Concept | Source |
|---|---|---|
| `infra/database.md` | All tables, cascade rules, missing indexes | `server/db/schema/` |
| `infra/storage.md` | S3 upload variants, key format, ACL, proxy route | `server/s3/index.ts` |
| `infra/docker-env.md` | Docker services, networking, env vars, volumes | `Dockerfile` · `docker-compose.yaml` |

### `risks/` — Vulnerabilities, Fragility, Debt

| File | Concept | Priority |
|---|---|---|
| `risks/security.md` | Auth bypass, role gap, upload risks, HTTPS missing | Load first for any security work |
| `risks/fragile.md` | Code paths that break silently with exact file refs | Load before modifying engine or submission |
| `risks/debt.md` | Dead code, disabled features, hardcoded values | Load before refactoring |

---

## Cross-Reference Rules

These topics appear once and are cross-referenced elsewhere:

| Topic | Canonical Location |
|---|---|
| TemplateData JSON shape | `entities/template.md` |
| layer[] z-index + delete bug | `engine/layers.md` |
| JWT unverified vulnerability | `risks/security.md` |
| Missing DB indexes | `infra/database.md` |
| Export pipeline steps | `engine/export.md` |
| S3 public ACL assumption | `infra/storage.md` |
| Role not enforced in Server Actions | `risks/security.md` |
| Client-generated template UUID | `entities/template.md` |

# Contracts: Validation Rules

**Source**: `src/shared/repository/*/dto.ts`, `src/shared/lib/elements.ts`, `src/shared/lib/data-url.ts`
**Related**: → `contracts/server-actions.md` (where rules are applied) · → `engine/export.md` (PNG rules)

---

## Auth Validation

```typescript
// auth/dto.ts — LoginSchema:
{
  email: z.string().email(),
  password: z.string().min(6),
}
```

---

## Order Validation

```typescript
// order/dto.ts — createOrderSchema:
{
  orderNumber: z.string().min(1),
  username: z.string().min(1),
  productVariants: z.array(z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().min(1),
  })).min(1),
}

// order/dto.ts — VerifyOrderByUsernameAndOrderNumberSchema:
{
  username: z.string().min(1),
  orderNumber: z.string().min(1),
}

// order/dto.ts — submitOrderSchema:
{
  orderId: z.string().uuid(),
  templates: z.array(z.object({
    orderProductVariantId: z.string().uuid(),
    dataURL: z.string(),           // further validated server-side (PNG + size)
  })),
}
```

---

## Product Validation

```typescript
// product/dto.ts:
// Product:
{ name: z.string().min(1), description: z.string().optional(), shopeeUrl: z.string().url().optional() }

// ProductVariant:
{ name: z.string().min(1), width: z.number().min(1), height: z.number().min(1) }
```

`width` and `height` must be ≥ 1. A `0×0` variant is prevented at validation level.

---

## Template Validation

Templates use no Zod schema. Validation is TypeScript type assertion only:
- `id` must be a non-empty string (UUID expected, not enforced)
- `productVariantId` required
- `previewFile` validated separately (see File Upload rules below)
- Element arrays: no per-element Zod validation at SA level

---

## File Upload Rules — Preview Image

Applied in `createTemplate` and `updateTemplate` SA when `previewFile` is present:

```typescript
// No MIME type check
// No file size limit enforced
// File.name used directly as S3 key (unsanitized)
// File.type used as Content-Type (unverified, client-provided)
```

**No validation on preview file uploads.** → `risks/security.md`

---

## File Upload Rules — Order Submission (submitOrder)

Strictly validated in `submitOrder` SA:

```typescript
// lib/data-url.ts:
function parseDataUrl(dataURL: string): { mime: string; base64: string }

// submitOrder validation sequence:
1. mime must equal "image/png"
2. PNG magic bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
3. Decoded buffer size ≤ MAX_BYTES (8 * 1024 * 1024 = 8MB)
4. orderProductVariantId must belong to the given orderId
5. imageUrl must be null (write-once)
```

---

## Text Element Constraints

```typescript
// lib/elements.ts — validateTextElement():
function validateTextElement(element: TextElement, content: string): string {
  if (element.textLimit && content.length > element.textLimit) {
    return content.slice(0, element.textLimit)    // truncate, not reject
  }
  return content
}
```

`textLimit` truncates silently — no error thrown, no user notification at the validation level.

---

## Text Height Calculation

```typescript
// lib/elements.ts — calculateTextHeight():
function calculateTextHeight(text: string, style: TextStyle, containerWidth: number): number {
  const canvas = document.createElement("canvas")   // new canvas every call
  const ctx = canvas.getContext("2d")
  ctx.font = `${style.fontSize}px ${style.fontFamily}`
  // word-wrap simulation via measureText()
  // returns natural-pixel height
}
```

Called on every text content change in `useAutoTextHeight`. Creates a new canvas element each time (no memoization).

---

## Session Env Validation

```typescript
// src/env.mjs — validated at startup (t3-oss/env-nextjs):
SERVER: {
  SESSION_PASSWORD: z.string().min(32),     // AES key for iron-session
  SESSION_SECRET: z.string().min(32),       // JWT signing key
  SESSION_EXPIRATION_TIME: z.string(),      // e.g. "8h"
  DATABASE_URL: z.string().url(),
  AWS_S3_ACCESS_KEY: z.string(),
  AWS_S3_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_URL: z.string().url(),
  AWS_S3_BUCKET_NAME: z.string(),
}
CLIENT: {
  NEXT_PUBLIC_APP_URL: z.string().url(),
}
```

**Name mismatch**: `.env.example` uses `JWT_SECRET` and `AWS_BUCKET_NAME`, but `env.mjs` validates `SESSION_SECRET` and `AWS_S3_BUCKET_NAME`. The example file is outdated.

App crashes at startup if any server-side env var fails validation.

---

## Pagination Defaults

Applied in multiple `get*` actions:

| Action | Default page | Default limit | Sort default |
|---|---|---|---|
| `getTemplates` | 1 | 10 | name ASC |
| `getOrders` | 1 | 10 | createdAt DESC |
| `getProducts` | 1 | 10 | createdAt DESC |
| `getAuditLogs` | 1 | 10 | createdAt DESC |

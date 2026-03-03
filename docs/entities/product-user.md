# Entities: Product, ProductVariant, User, AuditLog

**Source**: `src/server/db/schema/products.ts`, `src/server/db/schema/users.ts`, `src/server/db/schema/audit-logs.ts`
**Related**: → `contracts/middleware.md` (role enforcement) · → `infra/database.md` (full schema)

---

## Product

```
Table: products
─────────────────────────────────────────────────────
id           UUID PK DEFAULT gen_random_uuid()
name         VARCHAR(255) NOT NULL
description  VARCHAR(1000) nullable
shopee_url   VARCHAR(255) nullable
created_at   TIMESTAMP NOT NULL DEFAULT NOW()
updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
```

Cascade: DELETE → cascades to `product_variants` → cascades to `templates` + `order_product_variants`.

---

## ProductVariant

```
Table: product_variants
─────────────────────────────────────────────────────
id           UUID PK DEFAULT gen_random_uuid()
product_id   UUID NOT NULL FK → products(id) CASCADE DELETE
variant_name VARCHAR(255) NOT NULL   ← DB column is `variant_name`, TS field is `name`
description  VARCHAR(1000) nullable
width        INTEGER NOT NULL DEFAULT 0
height       INTEGER NOT NULL DEFAULT 0
created_at   TIMESTAMP NOT NULL DEFAULT NOW()
updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
```

**Canvas Dimension Authority**: `width` and `height` define the pixel dimensions of the canvas for all templates belonging to this variant. Templates copy these values at creation time — they are NOT dynamically linked. Changing a variant's dimensions does not resize existing templates.

Default `width = 0`, `height = 0` — must be explicitly set. A variant with `0×0` dimensions produces an invisible canvas.

**DB column name mismatch**: DB column is `variant_name`, TypeScript property is `name`. Drizzle maps this via `{ name: "variant_name" }` column config.

---

## User

```
Table: users
─────────────────────────────────────────────────────
id         INTEGER PK GENERATED ALWAYS AS IDENTITY
name       VARCHAR(255) NOT NULL
email      VARCHAR(255) NOT NULL UNIQUE
role       INTEGER NOT NULL      -- 1 = admin, 2 = superadmin
password   VARCHAR(255) NOT NULL -- bcrypt hash, 10 rounds
created_at TIMESTAMP NOT NULL DEFAULT NOW()
```

No `updated_at`. No soft delete. No email verification. No account lockout.

### Role System

```typescript
// src/shared/lib/enums.ts:
export const roleEnum = {
  1: "admin",
  2: "superadmin",
} as const
```

| Role | Access |
|---|---|
| `1` — admin | Standard dashboard tabs |
| `2` — superadmin | All tabs including user-management |

Role determines which `/dashboard/*` routes are accessible via middleware.
**Server Actions check `isLoggedIn` only — role is NOT verified at the SA level.** → `risks/security.md`

Tab-to-role mapping: `src/features/dashboard/data/tabs.ts`

---

## AuditLog

```
Table: audit_logs
─────────────────────────────────────────────────────
id           UUID PK DEFAULT gen_random_uuid()
user_id      INTEGER NOT NULL FK → users(id) CASCADE DELETE
action       VARCHAR(50) NOT NULL  -- "CREATE" | "UPDATE" | "DELETE"
entity_type  VARCHAR(50) NOT NULL  -- "product" | "product_variant" | "order" | "template"
entity_id    VARCHAR(255) NOT NULL
entity_name  VARCHAR(255) nullable
details      JSONB nullable        -- note: JSONB (not JSON like templates.data)
created_at   TIMESTAMP NOT NULL DEFAULT NOW()
```

Audit logs are fire-and-forget — created inside server actions after DB writes, errors silently discarded.

**Cascade risk**: If a User is deleted, their audit logs are CASCADE-deleted. Audit history is lost when admins are removed.

`sanitize()` exists in `src/shared/lib/logger.ts` to redact sensitive fields but is never called. → `risks/debt.md`

---

## Entity Relations Summary

```
Product ──────────< ProductVariant >────────────< Template
                          │
                          └──────────< OrderProductVariant >── Order

User ──────< AuditLog
```

Foreign keys use CASCADE DELETE throughout. → `infra/database.md` for cascade chain details.

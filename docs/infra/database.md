# Infrastructure: Database

**Engine**: PostgreSQL 15-alpine (Docker)
**ORM**: Drizzle ORM v0.43.1 + `pg` (node-postgres) v8.16.3
**Source**: `src/server/db/`, `src/server/db/schema/`
**Connection**: `src/server/db/index.ts` → `new Pool({ connectionString: env.DATABASE_URL })`
**Migration**: `drizzle-kit push` (schema push, no migration files)

---

## Schema Summary

```
users
├── id          INTEGER PK GENERATED ALWAYS AS IDENTITY
├── name        VARCHAR(255) NOT NULL
├── email       VARCHAR(255) NOT NULL UNIQUE
├── role        INTEGER NOT NULL          (1=admin, 2=superadmin — no DB enum)
├── password    VARCHAR(255) NOT NULL     (bcrypt hash)
└── created_at  TIMESTAMP NOT NULL

products
├── id          UUID PK DEFAULT gen_random_uuid()
├── name        VARCHAR(255) NOT NULL
├── description VARCHAR(1000)
├── shopee_url  VARCHAR(255)
├── created_at  TIMESTAMP NOT NULL
└── updated_at  TIMESTAMP NOT NULL

product_variants
├── id           UUID PK DEFAULT gen_random_uuid()
├── product_id   UUID NOT NULL FK→products(id) CASCADE DELETE
├── variant_name VARCHAR(255) NOT NULL     (TS field: `name`)
├── description  VARCHAR(1000)
├── width        INTEGER NOT NULL DEFAULT 0
├── height       INTEGER NOT NULL DEFAULT 0
├── created_at   TIMESTAMP NOT NULL
└── updated_at   TIMESTAMP NOT NULL

templates
├── id                  TEXT PK               (client-generated UUID — no DB default)
├── name                VARCHAR(255) NOT NULL
├── product_variant_id  UUID NOT NULL FK→product_variants(id) CASCADE DELETE
├── data                JSON NOT NULL         (not JSONB — no JSON indexing)
├── preview_url         TEXT
└── created_at          TIMESTAMP NOT NULL

orders
├── id           UUID PK DEFAULT gen_random_uuid()
├── order_number VARCHAR(255) NOT NULL
├── username     VARCHAR(255) NOT NULL
├── status       VARCHAR(50) NOT NULL DEFAULT 'no-images'
└── created_at   TIMESTAMP NOT NULL

order_product_variants
├── id                  UUID PK DEFAULT gen_random_uuid()
├── order_id            UUID NOT NULL FK→orders(id) CASCADE DELETE
├── product_variant_id  UUID NOT NULL FK→product_variants(id) CASCADE DELETE
└── image_url           VARCHAR(255)     (nullable; write-once; may truncate long URLs)

audit_logs
├── id           UUID PK DEFAULT gen_random_uuid()
├── user_id      INTEGER NOT NULL FK→users(id) CASCADE DELETE
├── action       VARCHAR(50) NOT NULL   (CREATE | UPDATE | DELETE)
├── entity_type  VARCHAR(50) NOT NULL   (product | product_variant | order | template)
├── entity_id    VARCHAR(255) NOT NULL
├── entity_name  VARCHAR(255)
├── details      JSONB                  (nullable; note: JSONB unlike templates.data)
└── created_at   TIMESTAMP NOT NULL
```

---

## Foreign Key Cascade Chain

```
products ──CASCADE──► product_variants
                           │
              ┌────────────┤
              │            │
              ▼            ▼
         templates    order_product_variants ◄──CASCADE── orders

users ──CASCADE──► audit_logs
```

**Cascade danger**: Deleting a `product` triggers:
`products` → `product_variants` → `templates` (all templates lost) AND `order_product_variants` (all order images lost)

No business-layer guard prevents this. The SA for `deleteProduct` calls `db.delete(productsTable)` without checking for active orders.

---

## Missing Indexes

All tables have only PK indexes. No additional indexes exist.

| Table | Column | Usage | Impact |
|---|---|---|---|
| `templates` | `product_variant_id` | `getTemplates` WHERE | Full scan on every list load |
| `order_product_variants` | `order_id` | `submitOrder`, `getOrders` | Full scan on submission |
| `order_product_variants` | `product_variant_id` | `getOrders` join | Full scan |
| `orders` | `status` | `getOrders` filter | Full scan |
| `orders` | `created_at` | default sort | No index scan |
| `audit_logs` | `created_at` | default sort | No index scan |

Impact is negligible at current data volume. Significant with thousands of orders/templates.

---

## Transactions

Drizzle transactions (`db.transaction()`) are used for:

| Operation | Tables in transaction |
|---|---|
| `createOrder` | INSERT orders + INSERT order_product_variants (one per quantity unit) |
| `updateOrder` | UPDATE orders + DELETE all OPV + INSERT new OPV |
| `deleteOrder` | DELETE OPV + DELETE orders |
| `submitOrder` | UPDATE OPV.image_url + UPDATE orders.status |

S3 uploads in `submitOrder` happen **before** the transaction. If the DB transaction fails after S3 uploads succeed, files remain in S3 with no DB record. → `risks/fragile.md`

---

## Drizzle vs Raw SQL

Templates use raw SQL; all other entities use Drizzle query builder:

```typescript
// templates/action.ts — raw SQL:
await db.execute(sql`INSERT INTO templates (id, name, ...) VALUES (...)`)

// products/action.ts — Drizzle:
await db.insert(productsTable).values({ name, ... })
```

Reason (inferred): The `data: JSON` column causes type inference issues with Drizzle's `insert()`. Raw SQL sidesteps this. → `risks/debt.md`

---

## Connection Pool

`pg.Pool` with defaults: max 10 connections, no explicit idle timeout, no connection timeout configured.

```typescript
// server/db/index.ts:
const pool = new Pool({ connectionString: env.DATABASE_URL })
export const db = drizzle({ client: pool })
```

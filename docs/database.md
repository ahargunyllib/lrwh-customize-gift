# Database

## Database Type

- **Engine**: PostgreSQL 15 (Alpine)
- **Client**: `pg` (node-postgres) v8.16.3
- **ORM**: Drizzle ORM v0.43.1
- **Connection**: Connection pool via `new Pool({ connectionString: env.DATABASE_URL })`
- **ORM instance**: `drizzle({ client: pool })` exported from `src/server/db/index.ts`

---

## Migration Strategy

- **Tool**: `drizzle-kit push` (schema push, not migration files)
- **Command**: `pnpm db:push`
- **Output dir**: `./drizzle` (artifacts)
- **Effect**: Pushes schema changes directly to the database without generating migration SQL files
- **Risk**: Schema drift in production is hard to track — no migration history

---

## Schema

### Table: `users`
**File**: `src/server/db/schema/users.ts`

```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  role        INTEGER NOT NULL,        -- 1: admin, 2: superadmin
  password    VARCHAR(255) NOT NULL,   -- bcrypt hash
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes**: Implicit unique index on `email`
**Soft delete**: No
**Notes**:
- `role` stored as integer — no enum constraint at DB level. Enum lives in `src/shared/lib/enums.ts`
- `password` stores bcrypt hash (10 rounds)
- No `updated_at` column — profile changes are not timestamped

---

### Table: `products`
**File**: `src/server/db/schema/products.ts`

```sql
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  shopee_url  VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Soft delete**: No (hard delete)
**Cascade**: Deletion cascades to `product_variants` (and transitively to `templates`, `order_product_variants`)

---

### Table: `product_variants`
**File**: `src/server/db/schema/products.ts`

```sql
CREATE TABLE product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,    -- Drizzle column name is 'variant_name'
  description  VARCHAR(1000),
  width        INTEGER NOT NULL DEFAULT 0,
  height       INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Cascade**: DELETE cascades to `templates` and `order_product_variants`
**Notes**:
- `width` and `height` default to `0` — must be explicitly set to valid values
- `variant_name` is the DB column name; TypeScript field name is `name`

---

### Table: `templates`
**File**: `src/server/db/schema/templates.ts`

```sql
CREATE TABLE templates (
  id                  TEXT PRIMARY KEY,        -- UUID generated client-side
  name                VARCHAR(255) NOT NULL,
  product_variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  data                JSON NOT NULL,           -- TemplateData blob (minus top-level fields)
  preview_url         TEXT,                    -- S3 URL of preview image
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes**: None beyond PK (no index on `product_variant_id`)
**Soft delete**: No
**Cascade**: Deleted when parent `product_variant` is deleted
**Notes**:
- `id` is TEXT (not UUID type) — generated client-side via `uuidv4()`
- `data` is `JSON` (not `JSONB`) — no JSON indexing possible
- No `updated_at` column

**JSON `data` column structure**:
```json
{
  "width": 400,
  "height": 800,
  "backgroundColor": "#ffffff",
  "backgroundImage": null,
  "images": [...],
  "texts": [...],
  "shapes": [...],
  "lines": [...],
  "layer": ["id1", "id2", ...]
}
```

---

### Table: `orders`
**File**: `src/server/db/schema/orders.ts`

```sql
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(255) NOT NULL,
  username     VARCHAR(255) NOT NULL,
  status       VARCHAR(50) NOT NULL DEFAULT 'no-images',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes**: None beyond PK
**Soft delete**: No
**Cascade**: Deletion cascades to `order_product_variants`
**Status values**: `"no-images"` | `"progress"` | `"completed"` (not enforced at DB level)
**Notes**:
- No unique constraint on `(username, order_number)` combination — duplicate orders are possible
- No `updated_at` column
- Status is not an enum type at DB level

---

### Table: `order_product_variants`
**File**: `src/server/db/schema/orders.ts`

```sql
CREATE TABLE order_product_variants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  image_url           VARCHAR(255)     -- S3 URL after user submission
);
```

**Indexes**: None beyond PK (no index on `order_id` or `product_variant_id`)
**Soft delete**: No
**Notes**:
- `image_url` is `VARCHAR(255)` — may be too short for long S3 URLs with long filenames or paths
- Once `image_url` is set, it cannot be updated (enforced in `submitOrder` Server Action, not at DB level)

---

### Table: `audit_logs`
**File**: `src/server/db/schema/audit-logs.ts`

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action       VARCHAR(50) NOT NULL,    -- CREATE, UPDATE, DELETE
  entity_type  VARCHAR(50) NOT NULL,    -- product, product_variant, order, template
  entity_id    VARCHAR(255) NOT NULL,
  entity_name  VARCHAR(255),
  details      JSONB,                   -- additional context (nullable)
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes**: None beyond PK
**Notes**:
- `details` uses `JSONB` (unlike `templates.data` which uses `JSON`)
- Cascade: if user is deleted, their audit logs are deleted — potential audit trail loss
- No pagination index on `created_at` (default sort column)

---

## Entity Relations Diagram

```
users ──────< audit_logs
  │
  └── (no direct FK to products/orders/templates — accessed via session userId)

products ──────< product_variants ──────< templates
                        │
                        └──────< order_product_variants >────── orders
```

---

## Cascade Rules

| Parent → Child | On Delete |
|---|---|
| `products` → `product_variants` | CASCADE |
| `product_variants` → `templates` | CASCADE |
| `product_variants` → `order_product_variants` | CASCADE |
| `orders` → `order_product_variants` | CASCADE |
| `users` → `audit_logs` | CASCADE |

**Critical risk**: Deleting a `product_variant` that has active orders will cascade-delete `order_product_variants`, effectively destroying order image data. No business-level guard prevents this in the current codebase.

---

## Unique Constraints

| Table | Constraint |
|---|---|
| `users.email` | UNIQUE |
| All others | No unique constraints beyond PK |

**Missing constraints**:
- No unique constraint on `(orders.username, orders.order_number)` — duplicate orders possible
- No unique constraint on `templates.name` per `product_variant_id`

---

## Soft Delete

**Not implemented**. All deletes are hard deletes. No `deleted_at` columns exist.

---

## Indexes

Only primary key indexes exist. No additional indexes on:
- `templates.product_variant_id` (filtered frequently in `getTemplates`)
- `order_product_variants.order_id` (filtered frequently in `submitOrder`, `getOrders`)
- `order_product_variants.product_variant_id`
- `audit_logs.created_at` (default sort column)
- `orders.status` (filtered in `getOrders`)
- `orders.created_at` (default sort column)

---

## Query Patterns

### Drizzle ORM vs Raw SQL

Most queries use Drizzle's query builder. However, some use raw SQL via `sql` template tag:

```typescript
// Raw SQL examples found in codebase:
sql`SELECT * FROM templates WHERE id = ${id}`
sql`INSERT INTO templates (id, name, ...) VALUES (...)`
sql`UPDATE templates SET name = ${req.name}, data = ${data} WHERE id = ${id}`
sql`DELETE FROM templates WHERE id = ${id}`
```

Template CRUD uses raw SQL while other entities (products, orders, users) use the Drizzle query builder. This inconsistency is noted in [technical-debt.md](./technical-debt.md).

### Transaction Usage

Transactions are used for multi-step operations:
- `createOrder`: INSERT orders + INSERT order_product_variants (atomic)
- `updateOrder`: UPDATE orders + DELETE/INSERT order_product_variants (atomic)
- `deleteOrder`: DELETE order_product_variants + DELETE orders (atomic)
- `submitOrder`: UPDATE order_product_variants.image_url + UPDATE orders.status (atomic)

---

## Connection Pooling

Using `pg.Pool` with default configuration (no explicit pool size, timeout, etc.):

```typescript
const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle({ client: pool });
```

Pool size defaults to `pg`'s default of 10 connections. No explicit idle timeout, connection timeout, or max connection configuration.

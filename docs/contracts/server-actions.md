# Contracts: Server Actions

**Source**: `src/shared/repository/*/action.ts`
**Pattern**: Every action file has `"use server"` at top. All return `ApiResponse<T>`.
**Related**: → `contracts/validation.md` (Zod schemas) · → `contracts/middleware.md` (route protection)

```typescript
type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string }
```

---

## Auth Actions (`auth/action.ts`)

| Action | Auth Required | DB Reads | DB Writes | S3 | Returns |
|---|---|---|---|---|---|
| `login(payload)` | No | users by email | — | — | `{ access_token: string }` |
| `logout()` | No | — | — | — | void |

---

## Session Actions (`session-manager/action.ts`)

| Action | Auth Required | Notes |
|---|---|---|
| `createSession(token)` | No | Decodes JWT → writes iron-session cookie |
| `destroySession()` | No | Clears cookie |
| `getSession()` | No | Returns plain session object (read-only) |

---

## Template Actions (`templates/action.ts`)

Uses **raw SQL** (not Drizzle query builder). → `risks/debt.md`

| Action | Auth Required | DB Reads | DB Writes | S3 | Side Effects |
|---|---|---|---|---|---|
| `getTemplates(query?)` | No | templates (paginated) | — | — | Pagination metadata |
| `getTemplateById(id)` | No | templates | — | — | — |
| `createTemplate(req)` | `isLoggedIn` | — | INSERT templates | Upload preview | AuditLog |
| `updateTemplate(req, id)` | `isLoggedIn` | — | UPDATE templates | Upload preview | AuditLog |
| `deleteTemplate(id)` | `isLoggedIn` | — | DELETE templates | — | AuditLog |

`getTemplates` query params: `{ productVariantId?, page?, limit? }` (default page=1, limit=10, order by name ASC)

---

## Order Actions (`order/action.ts`)

| Action | Auth Required | DB Reads | DB Writes | S3 | Notes |
|---|---|---|---|---|---|
| `verifyOrderByUsernameAndOrderNumber(req)` | No | orders + OPV + PV + products | — | — | 4 sequential queries |
| `getOrders(query)` | No (middleware-protected) | orders + OPV + PV + products | — | — | Paginated |
| `createOrder(req)` | `isLoggedIn` | — | orders + OPV (transaction) | — | AuditLog |
| `updateOrder({id}, req)` | `isLoggedIn` | — | orders + OPV DELETE+INSERT (transaction) | — | AuditLog |
| `deleteOrder({id})` | `isLoggedIn` | — | OPV + orders (transaction) | — | AuditLog |
| `submitOrder(req)` | **No** | orders + OPV | OPV.image_url + orders.status (transaction) | Upload per template | No AuditLog |

`submitOrder` has NO session check — any caller who knows `orderId` + `orderProductVariantId` can submit. → `risks/security.md`

`submitOrder` request shape:
```typescript
{
  orderId: string,
  templates: Array<{ orderProductVariantId: string; dataURL: string }>
}
```

`createOrder` request shape:
```typescript
{
  orderNumber: string,
  username: string,
  productVariants: Array<{ productVariantId: string; quantity: number }>
}
```
One OPV row is inserted per quantity unit.

---

## Product Actions (`product/action.ts`)

| Action | Auth Required | DB Writes | Side Effects |
|---|---|---|---|
| `getProducts(query?)` | No | — | — |
| `createProduct(data)` | `isLoggedIn` | INSERT products | AuditLog |
| `updateProduct({id}, data)` | `isLoggedIn` | UPDATE products | AuditLog |
| `deleteProduct({id})` | `isLoggedIn` | DELETE products (→ cascades PV → templates + OPV) | AuditLog |
| `createProductVariant({productId}, data)` | `isLoggedIn` | INSERT product_variants | AuditLog |
| `updateProductVariant(params, data)` | `isLoggedIn` | UPDATE product_variants | AuditLog |
| `deleteProductVariant(params)` | `isLoggedIn` | DELETE product_variants (→ cascades templates + OPV) | AuditLog |

---

## User / Admin Actions

| Action | Auth Required | Notes |
|---|---|---|
| `getUser({id})` | **No check** | Any call succeeds |
| `updateUser(params, data)` | `isLoggedIn` | Profile update |
| `updatePassword(params, data)` | `isLoggedIn` | Verifies current password first |
| `getAllAdmins()` | **No check** | Returns all users |
| `getAdmin({id})` | **No check** | Returns single user |
| `createAdmin(data)` | `isLoggedIn` | No role check — any admin can create superadmin |
| `updateAdmin(params, data)` | `isLoggedIn` | No role check |
| `deleteAdmin({id})` | `isLoggedIn` | No role check — any admin can delete any user |

---

## Audit Log Actions (`audit-log/action.ts`)

| Action | Auth Required | Notes |
|---|---|---|
| `getAuditLogs(query)` | No explicit check (middleware-protected route) | Paginated, filterable |
| `createAuditLog(data)` | No | Called internally only, fire-and-forget |

`createAuditLog` errors are silently swallowed — a failure to write an audit log does not fail the parent operation.

---

## HTTP Route (not a Server Action)

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/files/[...key]` | GET | **None** | Proxies S3 stream; Content-Type hardcoded to `image/png` |

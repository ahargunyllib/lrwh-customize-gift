# API Reference

## Architecture Note

This application uses **Next.js Server Actions** (`"use server"`) for nearly all data operations. There is only **one traditional HTTP API route**. Server Actions are called directly from client components and are not exposed as REST endpoints — they are invoked via React Server Action protocol (POST with special headers).

---

## HTTP API Routes

### `GET /api/files/[...key]`

**File**: `src/app/api/files/[...key]/route.ts`
**Auth required**: No (public route, but not in middleware matcher — unprotected)
**Method**: GET

**Purpose**: Proxies S3 object streams to the browser. Used to serve uploaded images through the application domain rather than directly from S3.

**Route params**:
- `key` — Catch-all segments joined as `key.join("/")` to form the S3 object key

**Request**: No body, no query params

**Response**:
- `200 OK` — `ReadableStream` of S3 object body
  - `Content-Type: image/png` (hardcoded regardless of actual file type)
  - `Cache-Control: public, max-age=31536000, immutable`
- `404 Not Found` — S3 object not found or stream retrieval failed

**Side effects**: None (read-only)

**External calls**: `getObjectStream(key)` → `S3Client.GetObjectCommand`

**Security note**: No auth check, no key validation. Any S3 key can be fetched if known. The `Content-Type` is hardcoded to `image/png` regardless of actual file type.

---

## Server Actions

Server Actions are defined with `"use server"` directive. They execute on the server, called directly from client components via TanStack Query mutations or React form actions.

### Auth Actions (`src/shared/repository/auth/action.ts`)

---

#### `login(payload: TLoginRequest)`

**Purpose**: Authenticate admin user, return JWT access token

**Request schema** (Zod `LoginSchema`):
```typescript
{
  email: string (email format),
  password: string (min 6 chars)
}
```

**Response** (`ApiResponse<TLoginResponse>`):
```typescript
// Success:
{ success: true, data: { access_token: string }, message: string }
// Failure:
{ success: false, error: "Unauthorized", message: "Invalid email or password" }
```

**DB reads**: `SELECT * FROM users WHERE email = ?`
**Auth required**: No
**Side effects**: None (session created separately via `createSession`)
**Security**: Times constant for invalid email (no timing attack mitigation detected for password comparison)

---

#### `logout()`

**Purpose**: Destroy current session

**Request**: None
**Response**: `void`
**DB writes**: None (iron-session cookie cleared)
**Auth required**: No (session destroyed regardless)

---

### Session Actions (`src/shared/repository/session-manager/action.ts`)

---

#### `createSession(token: string)`

**Purpose**: Decode JWT, write user data to iron-session cookie

**Request**: `access_token` string (JWT)
**DB reads**: None (decodes JWT only)
**DB writes**: None (writes to encrypted cookie)
**Side effects**: Sets `session-cookie` HTTP cookie (httpOnly, secure in prod, maxAge 8h - 60s)

---

#### `destroySession()`

**Purpose**: Clear session cookie

---

#### `getSession()`

**Purpose**: Read current session, returns plain JSON object

**Returns**:
```typescript
// Logged in:
{ isLoggedIn: true, userId: string, role: "admin" | "superadmin" }
// Not logged in:
{ isLoggedIn: false }
```

---

### Template Actions (`src/shared/repository/templates/action.ts`)

---

#### `getTemplates(query?)`

**Auth required**: No (public read — no session check)

**Request**:
```typescript
{
  productVariantId?: string (UUID),
  page?: number,
  limit?: number
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    templates: TemplateData[],
    pagination: { total_data, total_page, page, limit }
  }
}
```

**DB reads**: `SELECT FROM templates WHERE product_variant_id = ? LIMIT ? OFFSET ?` + COUNT
**Default**: page=1, limit=10, ordered by name ASC

---

#### `getTemplateById(id: string)`

**Auth required**: No (public read)

**Request**: Template UUID string

**Response**:
```typescript
{
  success: true,
  data: { template: TemplateData }
}
```

**DB reads**: Raw SQL `SELECT * FROM templates WHERE id = ?`

---

#### `createTemplate(req: CreateTemplateRequest)`

**Auth required**: Yes (`session.isLoggedIn`)

**Request** (`CreateTemplateRequest = TemplateData`):
```typescript
{
  id: string,              // client-generated UUID
  name: string,
  productVariantId: string,
  previewFile: File | null,
  previewUrl: string | null,
  width, height, backgroundColor, backgroundImage?,
  images, texts, shapes, lines, layer
}
```

**Response**:
```typescript
{ success: true, data: null, message: "Template created successfully" }
```

**DB writes**: INSERT into `templates`
**Storage writes**: S3 upload if `previewFile` provided
**Side effects**: Creates AuditLog (fire-and-forget)

---

#### `updateTemplate(req: UpdateTemplateRequest, id: string)`

**Auth required**: Yes (`session.isLoggedIn`)

**Request**: Same shape as `CreateTemplateRequest` + template `id` as separate param

**DB writes**: UPDATE `templates` WHERE id
**Storage writes**: S3 upload if `previewFile` provided
**Side effects**: Creates AuditLog (fire-and-forget)

---

#### `deleteTemplate(id: string)`

**Auth required**: Yes (`session.isLoggedIn`)

**Request**: Template UUID string

**DB writes**: DELETE FROM `templates` WHERE id
**Side effects**: Creates AuditLog (fire-and-forget)

---

### Order Actions (`src/shared/repository/order/action.ts`)

---

#### `verifyOrderByUsernameAndOrderNumber(req)`

**Auth required**: No (public — used by users without login)

**Request** (Zod `VerifyOrderByUsernameAndOrderNumberSchema`):
```typescript
{
  username: string (min 1),
  orderNumber: string (min 1)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    order: {
      id, username, orderNumber,
      productVariants: [{
        id, name,
        product: { id, name },
        templates: [{ id: orderProductVariantId, dataURL: null }]
      }]
    }
  }
}
```

**DB reads**: orders + order_product_variants + product_variants + products (4 queries)

---

#### `getOrders(query: GetOrdersQuery)`

**Auth required**: No explicit check (assumes dashboard access is middleware-protected)

**Request**:
```typescript
{
  search?: string,
  page?: number,
  limit?: number,
  sortBy?: "createdAt" | "orderNumber" | "username",
  sortOrder?: "asc" | "desc",
  status?: "all" | "completed" | "progress" | "no-images"
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    orders: [{
      id, orderNumber, username, createdAt,
      products: [{ id, name, productVariant: {id, name, width, height}, imageUrl }]
    }],
    meta: { pagination }
  }
}
```

**DB reads**: orders + order_product_variants + product_variants + products (N+1 risk, see performance analysis)

---

#### `createOrder(req: CreateOrderRequest)`

**Auth required**: Yes (`session.isLoggedIn`)

**Request** (Zod `createOrderSchema`):
```typescript
{
  orderNumber: string,
  username: string,
  productVariants: [{
    productVariantId: string (UUID),
    quantity: number (min 1)
  }]
}
```

**DB writes**: INSERT `orders` + INSERT `order_product_variants` (transaction, one row per quantity unit)
**Side effects**: AuditLog (fire-and-forget)

---

#### `updateOrder({id}, req: UpdateOrderRequest)`

**Auth required**: Yes (`session.isLoggedIn`)

**DB writes**: UPDATE `orders` + DELETE+INSERT `order_product_variants` (transaction)
**Side effects**: AuditLog (fire-and-forget)

---

#### `deleteOrder({id})`

**Auth required**: Yes (`session.isLoggedIn`)

**DB writes**: DELETE `order_product_variants` + DELETE `orders` (transaction)
**Side effects**: AuditLog (fire-and-forget)

---

#### `submitOrder(req: SubmitOrderRequest)`

**Auth required**: No (public — called by users without admin login)

**Request** (Zod `submitOrderSchema`):
```typescript
{
  orderId: string (UUID),
  templates: [{
    orderProductVariantId: string (UUID),
    dataURL: string  // base64 PNG data URL, max ~8MB decoded
  }]
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    status: "no-images" | "progress" | "completed",
    remainingCount: number
  }
}
```

**Validation**:
1. Order must exist
2. `orderProductVariantId` must belong to the order
3. `imageUrl` must be null (not already submitted)
4. Data URL must be valid base64 PNG (magic bytes checked)
5. Decoded size ≤ 8MB (`MAX_BYTES = 8 * 1024 * 1024`)

**DB reads**: orders + order_product_variants (per template)
**DB writes**: UPDATE `order_product_variants.image_url` + UPDATE `orders.status` (transaction)
**Storage writes**: S3 upload per template (parallel)
**Side effects**: None beyond DB + S3 updates

---

### Product Actions (`src/shared/repository/product/action.ts`)

---

#### `getProducts(query: GetProductsQuery)`

**Auth required**: No (public read)

**Request**: `{ search?, page?, limit? }`

**Response**: Products with nested variants array + pagination

**DB reads**: products + product_variants (batch by productIds)

---

#### `createProduct(data)` / `updateProduct({id}, data)` / `deleteProduct({id})`

**Auth required**: Yes (session check)
**DB writes**: INSERT/UPDATE/DELETE `products`
**Side effects**: AuditLog (fire-and-forget)

---

#### `createProductVariant({productId}, data)` / `updateProductVariant(params, data)` / `deleteProductVariant(params)`

**Auth required**: Yes (session check)
**DB writes**: INSERT/UPDATE/DELETE `product_variants`
**Side effects**: AuditLog (fire-and-forget)

---

### User/Admin Actions

#### `getUser({id})` / `updateUser(params, data)` / `updatePassword(params, data)`
**File**: `src/shared/repository/user/action.ts`
**Auth required**: No explicit session check in `getUser`; `updateUser`/`updatePassword` check session

#### `getAllAdmins()` / `getAdmin({id})` / `createAdmin(data)` / `updateAdmin(params, data)` / `deleteAdmin({id})`
**File**: `src/shared/repository/admin/action.ts`
**Auth required**: `createAdmin`/`updateAdmin`/`deleteAdmin` check session; reads do not

---

### Audit Log Actions

#### `getAuditLogs(query: GetAuditLogsQuery)`
**File**: `src/shared/repository/audit-log/action.ts`

**Request**:
```typescript
{
  search?: string,
  action?: "CREATE" | "UPDATE" | "DELETE",
  entityType?: "product" | "product_variant" | "order" | "template",
  page?: number,
  limit?: number
}
```

**Response**: AuditLog[] with joined user data + pagination

#### `createAuditLog(data)`
**Called internally** by other Server Actions (fire-and-forget pattern, not exposed to client directly)

---

## TanStack Query Hooks (Client-Side)

Each Server Action has a corresponding React Query hook in `query.ts`:

| Hook | Action | Type |
|---|---|---|
| `useGetTemplatesQuery` | `getTemplates` | useQuery |
| `useGetTemplateById` | `getTemplateById` | useQuery |
| `useCreateTemplateMutation` | `createTemplate` | useMutation |
| `useUpdateTemplateMutation` | `updateTemplate` | useMutation |
| `useDeleteTemplateMutation` | `deleteTemplate` | useMutation |
| `useGetOrdersQuery` | `getOrders` | useQuery |
| `useVerifyOrderByUsernameAndOrderNumberMutation` | `verifyOrderByUsernameAndOrderNumber` | useMutation |
| `useCreateOrderMutation` | `createOrder` | useMutation |
| `useUpdateOrderMutation` | `updateOrder` | useMutation |
| `useDeleteOrderMutation` | `deleteOrder` | useMutation |
| `useSubmitOrderMutation` | `submitOrder` | useMutation |
| `useGetProductsQuery` | `getProducts` | useQuery |
| `useCreateProductMutation` | `createProduct` | useMutation |
| `useUpdateProductMutation` | `updateProduct` | useMutation |
| `useDeleteProductMutation` | `deleteProduct` | useMutation |
| `useCreateProductVariantMutation` | `createProductVariant` | useMutation |
| `useUpdateProductVariantMutation` | `updateProductVariant` | useMutation |
| `useDeleteProductVariantMutation` | `deleteProductVariant` | useMutation |
| `useGetUserQuery` | `getUser` | useQuery |
| `useUpdateUserMutation` | `updateUser` | useMutation |
| `useUpdatePasswordMutation` | `updatePassword` | useMutation |
| `useGetAllAdminsQuery` | `getAllAdmins` | useQuery |
| `useGetAdminQuery` | `getAdmin` | useQuery |
| `useCreateAdminMutation` | `createAdmin` | useMutation |
| `useUpdateAdminMutation` | `updateAdmin` | useMutation |
| `useDeleteAdminMutation` | `deleteAdmin` | useMutation |
| `useGetAuditLogsQuery` | `getAuditLogs` | useQuery |
| `useLoginMutation` | `login` | useMutation |
| `useLogoutMutation` | `logout` | useMutation |
| `useSessionQuery` | `getSession` | useQuery |

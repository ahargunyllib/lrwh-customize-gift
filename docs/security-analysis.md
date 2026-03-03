# Security Analysis

## Critical Issues

### 1. JWT Signature Not Verified

**File**: `src/shared/lib/decode.ts`
**Severity**: Critical

```typescript
// INSECURE: decodeJwt does NOT verify signature
export function decodeToken(token: string): TokenPayload {
  return jose.decodeJwt(token)
}
```

`jose.decodeJwt()` decodes without verifying the JWT signature. The correct function is `jose.jwtVerify()`.

**Impact**: If an attacker can craft or intercept a JWT (e.g., man-in-the-middle on HTTP — which is the case since no HTTPS is configured), they could supply a JWT with arbitrary `user_id` and `role` values, and the session would be created with those values.

**In practice**: The JWT is only transmitted server-to-client within the same HTTPS session (Server Action response), and then immediately decoded by another Server Action (`createSession`). The window of exploitation is narrow but the vulnerability is real.

**Fix**: Replace `jose.decodeJwt(token)` with `await jose.jwtVerify(token, secret)` in `decodeToken`.

---

### 2. No HTTPS in Docker Setup

**File**: `docker-compose.yaml`
**Severity**: High

Traefik is configured with HTTP only (`--entrypoints.web.address=:80`). No TLS termination, no HTTPS redirect, no Let's Encrypt/ACME configured.

**Impact**: All traffic between browser and server is in plaintext, including:
- Session cookies (though encrypted by iron-session)
- JWT tokens in transit
- Uploaded image data URLs (up to 8MB of user data)
- Admin credentials during login

**Note**: `session-cookie` has `secure: true` hardcoded, meaning it will NOT be sent over HTTP. This will cause login to fail entirely on the current HTTP-only setup unless the browser is being accessed via HTTPS through another means (e.g., Cloudflare proxy).

---

### 3. Role Not Enforced in Server Actions

**Files**: All `action.ts` files
**Severity**: High

Server Actions check `session.isLoggedIn` but NOT `session.role`. Example:

```typescript
// admin/action.ts — createAdmin checks only isLoggedIn
if (!session.isLoggedIn) {
  return { success: false, error: "Unauthorized" }
}
// No role check — any admin (role 1) can create other admins
```

**Impact**: A role-1 admin can call any admin management action that should be restricted to role-2 (superadmin), including creating/deleting admin accounts.

**Also**: `getUser`, `getAllAdmins`, `getAdmin` have NO session check at all — any authenticated request can call these.

---

### 4. Insecure File Upload — Missing MIME Validation at Upload

**File**: `src/server/s3/index.ts` (`uploadFileToS3`)
**Severity**: High

The preview file upload path does NOT validate MIME type or file content:

```typescript
export const uploadFileToS3 = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer())
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: file.name,               // ← filename from client, no sanitization
    Body: buffer,
    ACL: "public-read",           // ← public access
    ContentType: file.type,       // ← from client, unvalidated
  })
}
```

**Issues**:
- `file.name` used directly as S3 key — no sanitization, potential path traversal in S3 key
- `file.type` is the browser-provided MIME type (unverified)
- No file size limit enforced for preview uploads
- `ACL: "public-read"` — all uploads are publicly accessible

**Contrast**: `submitOrder` does validate PNG format and size, but the template preview upload path does not.

---

### 5. S3 Proxy Route Unprotected

**File**: `src/app/api/files/[...key]/route.ts`
**Severity**: Medium

```typescript
export async function GET(_, { params }) {
  const key = paramsValue.key.join("/")
  // No auth check
  // No key validation
  return new Response(s3stream, { headers: { "Content-Type": "image/png" } })
}
```

Any S3 key can be fetched by anyone who knows the URL. The route is not in the middleware matcher for auth protection.

**Additionally**: `Content-Type` is hardcoded to `image/png` regardless of actual file type. If non-PNG files were uploaded, they would be served with wrong MIME type.

---

### 6. Hardcoded Credentials in Docker Compose

**File**: `docker-compose.yaml`
**Severity**: Medium

```yaml
environment:
  POSTGRES_USER: lrwhuser
  POSTGRES_PASSWORD: lrwhpassword   # hardcoded
  POSTGRES_DB: lrwhdb
```

If `docker-compose.yaml` is committed to a public repository, credentials are exposed. Docker secrets or environment variable references should be used.

---

### 7. No Rate Limiting on Login

**File**: `src/shared/repository/auth/action.ts`
**Severity**: Medium

The `login()` Server Action has no rate limiting. Brute-force attacks against admin accounts are possible. No account lockout, no CAPTCHA, no exponential backoff.

**Compounded by**: User enumeration is possible — the error message is the same for invalid email and invalid password (`"Invalid email or password"`), but timing may differ slightly.

---

### 8. Path Traversal Risk in S3 Key

**File**: `src/server/s3/index.ts` (`uploadFileToS3`)
**Severity**: Medium

`file.name` is used directly as the S3 object key without sanitization:

```typescript
Key: file.name,
```

A file named `../../etc/passwd` or `../admin/secret` could potentially create an S3 object at an unexpected path (within the bucket). This is limited to S3 bucket namespace, not filesystem, but could allow overwriting existing objects if the key collision resolves to a sensitive file.

**The `submitOrder` path is protected**: Key is computed as `{username}_{orderNumber}_{sha256}.png` — deterministic and safe.

---

### 9. No CSRF Protection

**Severity**: Low-Medium

Next.js Server Actions have built-in CSRF protection via origin checking for cross-origin requests. However, the application uses `cookies-next` for `returnTo` cookie management on the client, and some operations could theoretically be triggered cross-origin.

**Assessment**: Next.js App Router Server Actions include same-origin enforcement by default, which provides basic CSRF protection. This is likely acceptable.

---

### 10. Unsafe `submitOrder` Access Control (User-to-Order Binding)

**File**: `src/shared/repository/order/action.ts`
**Severity**: Medium

The `submitOrder` action accepts:
- `orderId` — any UUID
- `orderProductVariantId` — any UUID belonging to that order

There is NO session check. Any user who knows an `orderId` and an `orderProductVariantId` can submit images for that order. The only access control is:
1. Order must exist
2. `orderProductVariantId` must belong to that order
3. `imageUrl` must be null

**Client-side guard**: The client validates `orderProductVariantId` against the Zustand store, but this is trivially bypassable.

**Impact**: An attacker who knows another user's order number (or can guess it) could overwrite their photo slot with unwanted content (before the legitimate user submits).

---

### 11. XSS Risk in Template Rendering

**File**: Template rendering components
**Severity**: Low

Text content in templates is rendered via React, which escapes HTML by default. No `dangerouslySetInnerHTML` usage detected in template element rendering. CSS styles come from the stored `TextElement.style` object.

**Potential concern**: `backgroundImage: template.backgroundImage` is interpolated into a CSS style. If the URL contains `javascript:` or malformed CSS, it could potentially cause issues, but browsers generally block this in style attributes.

**Assessment**: Low risk due to React's default XSS protections, but the template data is admin-supplied so trust is implicit.

---

### 12. Environment Variable Inconsistency

**File**: `.env.example` vs `src/env.mjs`
**Severity**: Low

`.env.example` lists `JWT_SECRET` and `AWS_BUCKET_NAME`, but `src/env.mjs` validates `SESSION_SECRET` and `AWS_S3_BUCKET_NAME`. Developers following `.env.example` will set the wrong variable names and the app will fail at startup with unclear errors.

---

### 13. Winston Log File Exposure

**File**: `docker-compose.yaml`
**Severity**: Low

Logs are stored in `/app/logs` (mounted via Docker volume). Logs may contain sensitive operation context (user IDs, entity names, operation types). The log volume is not restricted — anyone with host access to the volume can read logs.

`sanitize()` function exists in `src/shared/lib/logger.ts` and should be used for sensitive fields, but it is NOT called in any of the current log operations — it's defined but unused.

---

## Summary Table

| Issue | Severity | File | Status |
|---|---|---|---|
| JWT not verified (decodeJwt vs jwtVerify) | Critical | `lib/decode.ts` | Open |
| No HTTPS in Docker | High | `docker-compose.yaml` | Open |
| Role not enforced in Server Actions | High | All `action.ts` files | Open |
| No MIME/size validation on preview upload | High | `server/s3/index.ts` | Open |
| S3 proxy route unprotected | Medium | `api/files/route.ts` | Open |
| Hardcoded DB password in compose | Medium | `docker-compose.yaml` | Open |
| No rate limiting on login | Medium | `auth/action.ts` | Open |
| Path traversal in S3 key | Medium | `server/s3/index.ts` | Open |
| No submitOrder auth binding | Medium | `order/action.ts` | Open |
| No CSRF protection (explicit) | Low | — | Partially mitigated by Next.js |
| XSS in template render | Low | template components | Low risk |
| Env var name mismatch in .env.example | Low | `.env.example` | Open |
| Logger sanitize() unused | Low | `lib/logger.ts` | Open |
| Docker socket in Traefik | High | `docker-compose.yaml` | Open |

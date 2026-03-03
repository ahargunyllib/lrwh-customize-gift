# Risks: Security Vulnerabilities

**Related**: → `flows/auth.md` (auth mechanics) · → `contracts/middleware.md` (enforcement) · → `infra/storage.md` (upload risks)

---

## CRITICAL: JWT Signature Not Verified

**File**: `src/shared/lib/decode.ts`
**Impact**: Session creation accepts unverified tokens

```typescript
// CURRENT (insecure):
export function decodeToken(token: string): TokenPayload {
  return jose.decodeJwt(token)    // decodes WITHOUT verifying signature
}

// SHOULD BE:
export async function decodeToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, secret)
  return payload
}
```

`createSession()` calls `decodeToken()`. If an attacker supplies a crafted JWT (with any `role` value), the session is created with those values unchecked.

**Exploitability window**: JWT travels in a Server Action response, not a public URL. Practical exploitation requires MITM. Combined with the HTTP-only setup below, the risk is elevated.

---

## HIGH: No HTTPS

**File**: `docker-compose.yaml`
All traffic on HTTP (port 80 only). No TLS termination, no Let's Encrypt, no redirect to HTTPS.

`session-cookie` has `secure: true` hardcoded (`src/shared/lib/session.ts`) — this means **the session cookie is never transmitted over HTTP**. The combination of HTTP-only Docker setup + `secure: true` cookie makes login non-functional in the default deployment.

This suggests the actual production deployment relies on an external HTTPS terminator (Cloudflare, load balancer) not visible in this repository.

---

## HIGH: Role Not Enforced in Server Actions

**Files**: All `src/shared/repository/*/action.ts`
Server Actions check `session.isLoggedIn` only. Role (admin vs superadmin) is never checked.

```typescript
// admin/action.ts — createAdmin:
if (!session.isLoggedIn) return { success: false, error: "Unauthorized" }
// No: if (session.role !== "superadmin") return error
```

A role-1 admin can:
- Create / delete other admin accounts (`createAdmin`, `deleteAdmin`)
- Access user management data (`getAllAdmins`, `getAdmin`)
- Perform any superadmin-level operation

Role enforcement exists only at the URL level via `roleBasedAccess` middleware.

---

## HIGH: Unvalidated File Upload (Preview)

**File**: `src/server/s3/index.ts` → `uploadFileToS3`

No MIME type validation, no magic byte check, no size limit enforced:
```typescript
// No validation before upload:
Key: file.name,            // raw filename, potential S3 key collision or path confusion
ContentType: file.type,    // from browser, fully controlled by client
ACL: "public-read",        // all files publicly accessible
```

Contrast with `submitOrder` which validates PNG magic bytes and enforces 8MB limit.

---

## MEDIUM: submitOrder Has No User Authentication

**File**: `src/shared/repository/order/action.ts`

`submitOrder` has no session check. Any caller who knows:
- A valid `orderId`
- A valid `orderProductVariantId` belonging to that order

...can submit arbitrary images for that slot (before the legitimate user does).

Client-side guard (Zustand store validation in `/templates/[id]`) is trivially bypassable by calling the Server Action directly.

---

## MEDIUM: S3 Proxy Route Unprotected

**File**: `src/app/api/files/[...key]/route.ts`

No authentication. Any S3 key in the bucket is accessible to anyone:
```typescript
export async function GET(_, { params }) {
  const key = params.key.join("/")
  // No auth check, no key validation
  return new Response(stream, { headers: { "Content-Type": "image/png" } })
}
```

Additionally: `Content-Type` is always `image/png` regardless of actual object type.

---

## MEDIUM: No Rate Limiting on Login

**File**: `src/shared/repository/auth/action.ts`

`login()` Server Action has no rate limiting, no account lockout, no CAPTCHA. Brute-force attacks against admin email/password combinations are unrestricted.

---

## MEDIUM: Hardcoded DB Credentials in Compose

**File**: `docker-compose.yaml`

```yaml
POSTGRES_PASSWORD: lrwhpassword   # in version-controlled file
```

If this repository is public or shared, the DB password is exposed.

---

## MEDIUM: Docker Socket Mounted in Traefik

**File**: `docker-compose.yaml`

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

Full Docker daemon access from within the Traefik container. Container compromise = host compromise.

---

## LOW: Path Traversal in S3 Key (Preview Upload)

`file.name` used as S3 key without sanitization. A file named `../secret` creates an object at a different path level within the bucket (S3 bucket namespace, not filesystem). Could overwrite existing objects if key resolves to a known path.

---

## LOW: getUser / getAllAdmins / getAdmin Have No Auth Check

```typescript
// user/action.ts — getUser:
// No session check — returns user data to anyone
export async function getUser({ id }) {
  return db.query.usersTable.findFirst({ where: eq(...) })
}
```

These read-only actions expose user data (name, email, role — not password) to unauthenticated callers. Password is hashed and excluded from select.

---

## LOW: .env.example Variable Name Mismatch

`.env.example` lists `JWT_SECRET` and `AWS_BUCKET_NAME`. Actual validated variables are `SESSION_SECRET` and `AWS_S3_BUCKET_NAME`. App crashes at startup with misleading error if following the example.

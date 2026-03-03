# Authentication

## Auth Flow Overview

```
1. Admin navigates to /login
2. Submits email + password via LoginForm
3. useLoginMutation → login() Server Action
4. Server: lookup user by email → compare bcrypt hash
5. Server: encode JWT (HS256) with user_id, email, role
6. Server returns { access_token: JWT }
7. Client: createSession(access_token) Server Action
8. Server: decode JWT → write user data to iron-session cookie
9. Client: router.replace(returnTo || "/dashboard")
10. All subsequent requests: middleware reads session cookie
```

---

## Session Strategy

**Library**: `iron-session` v8.0.4

Sessions are stored as **encrypted cookies** (not server-side sessions). The entire session payload is encrypted and stored in the browser cookie.

```typescript
// src/shared/lib/session.ts
export const sessionOptions: SessionOptions = {
  password: env.SESSION_PASSWORD,    // min 32 chars, used for AES encryption
  cookieName: "session-cookie",
  cookieOptions: {
    maxAge: 8 * 60 * 60 * 1000 - 60 * 1000,  // 8 hours - 1 minute
    secure: true,                              // HTTPS only (always)
  },
};
```

**Session payload type**:
```typescript
type SessionData =
  | { isLoggedIn: false }
  | { isLoggedIn: true; userId: string; role: keyof typeof roleEnum }
```

---

## JWT Usage

**Library**: `jose` v6.0.10
**Algorithm**: HS256

JWT is an **intermediate step** only, not the primary session mechanism:
1. `login()` creates JWT from user data
2. JWT returned to client
3. `createSession()` decodes JWT and writes decoded data to iron-session cookie
4. JWT is not stored persistently — the iron-session cookie is the session store

```typescript
// Encode (sign):
const jwt = new jose.SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime(env.SESSION_EXPIRATION_TIME)  // e.g. "8h"
const token = await jwt.sign(new TextEncoder().encode(env.SESSION_SECRET))

// Decode (no verification — uses decodeJwt, not jwtVerify):
const decoded = jose.decodeJwt(token)
```

**Security gap**: `decodeJwt()` is used instead of `jwtVerify()`. This means the JWT signature is NOT verified when creating the session. Anyone who can construct a valid-looking JWT payload (even without the secret) could potentially create a session. See [security-analysis.md](./security-analysis.md).

---

## Cookie Configuration

| Property | Value |
|---|---|
| Cookie name | `session-cookie` |
| Encryption | AES via iron-session (using `SESSION_PASSWORD`) |
| `maxAge` | ~8 hours (8h - 60s buffer) |
| `secure` | `true` (always — requires HTTPS) |
| `httpOnly` | `true` (iron-session default) |
| `sameSite` | iron-session default |

**Note**: `secure: true` is hardcoded, not conditional on `NODE_ENV`. This will break on plain HTTP, including local development without HTTPS.

---

## Middleware

**File**: `src/middleware.ts`
**Matcher**: `/, /old, /editor/:path*, /design-system, /api/:path*, /dashboard/:path*`

The middleware runs a pipeline of guards in order:

```typescript
const middlewares = [
  devOnlyGuard,       // Block /design-system in non-dev
  authGuard,          // Redirect unauthenticated to /login
  redirectRules,      // Static redirects (/ → /templates/onboarding)
  roleBasedAccess,    // Dashboard tab access control
]
```

### `authGuard` (src/middlewares/auth-guard.ts)

Checks `PROTECTED_ROUTES` list. If route matches and `session.isLoggedIn === false`:
- Redirects to `/login`
- Stores original path in `returnTo` cookie for post-login redirect

**Protected routes**:
```typescript
PROTECTED_ROUTES = [
  { path: /^\/dashboard/ },
  { path: /^\/editor\/[^\/]+\/edit$/ },  // /editor/:id/edit
  { path: /^\/editor\/create$/ },
  { path: /^\/design-system/ },
  { path: /^\/old/ },
]
```

**Not protected** (no auth required):
- `/templates/*` — users access without login (username+orderNumber verification only)
- `/templates/[id]` — access gated by Zustand store validation client-side only
- `/api/files/*` — no auth check
- `GET /api/*` — not in PROTECTED_ROUTES (but Server Actions verify session internally)

### `roleBasedAccess` (src/middlewares/role-access-guard.ts)

After auth check, for `/dashboard/*` routes:
- Compares pathname against allowed tabs for the user's role
- If no tab matches: redirect to `/dashboard/profile`
- Tab access defined in `src/features/dashboard/data/tabs.ts`

---

## Role System

**Enum** (`src/shared/lib/enums.ts`):
```typescript
export const roleEnum = {
  1: "admin",
  2: "superadmin",
} as const
```

**Dashboard tab access** (`src/features/dashboard/data/tabs.ts`):
- Role 1 (admin): limited set of tabs (Unknown from codebase — file not read)
- Role 2 (superadmin): extended set including user-management

**Access enforcement**:
1. **Middleware**: `roleBasedAccess` checks dashboard URL against allowed tabs
2. **UI**: `AppSidebar` filters tabs by `session.role`
3. **Server Actions**: Only `session.isLoggedIn` is checked — **role is NOT verified in Server Actions**

---

## Access Control Enforcement

| Layer | What it checks | Where enforced |
|---|---|---|
| Middleware | `isLoggedIn`, role-based tab access | `/dashboard/*`, `/editor/:id/edit`, `/editor/create` |
| Server Actions | `isLoggedIn` only | All mutating actions |
| Client-side | Zustand store (orderProductVariantId exists in store) | `/templates/[id]` |
| S3 proxy route | Nothing | `/api/files/*` |

**Gap**: Server Actions check `isLoggedIn` but not `role`. A role-1 admin could call any Server Action that a role-2 superadmin can call (e.g., user management actions).

---

## Login Return URL

The `returnTo` cookie stores the pre-login URL:

```typescript
// authGuard sets it:
response.cookies.set("returnTo", `${pathname}${req.nextUrl.search}`, {
  path: "/",
  secure: process.env.NODE_ENV === "production",  // conditional — unlike session cookie
})

// useLoginMutation reads it:
const returnTo = getCookie("returnTo")  // client-side cookie read
router.replace(returnTo || "/dashboard")
setCookie("returnTo", "")
```

**Note**: `returnTo` cookie is `secure` only in production, but `session-cookie` is always `secure`. Inconsistency.

---

## Password Management

- **Hashing**: `bcrypt-ts` with 10 salt rounds
- **Comparison**: `compare(plaintext, hash)` from `bcrypt-ts`
- **Change password**: `updatePassword()` Server Action verifies current password before allowing change
- **Reset password**: No password reset / forgot password flow detected

---

## Security Gaps

See [security-analysis.md](./security-analysis.md) for detailed analysis. Key issues:

1. **JWT not verified**: `decodeJwt()` used instead of `jwtVerify()` — JWT signature not checked
2. **Role not enforced in Server Actions**: Any authenticated user can call superadmin actions
3. **`/api/files/*` unprotected**: Any S3 key accessible without auth
4. **No rate limiting on login**: Brute-force attacks possible
5. **No CSRF protection**: Server Actions rely on same-site cookie defaults
6. **`session-cookie` always `secure: true`**: Breaks local HTTP development

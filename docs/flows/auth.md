# Flow: Authentication & Session

**Entry route**: `/login`
**Auth library**: iron-session v8.0.4 (encrypted cookie) + jose v6.0.10 (JWT)
**Source**: `src/shared/repository/auth/`, `src/shared/repository/session-manager/`, `src/shared/lib/session.ts`, `src/shared/lib/decode.ts`
**Related**: → `contracts/middleware.md` (route enforcement) · → `risks/security.md` (vulnerabilities)

---

## Login Flow

```
1. Admin submits email + password via LoginForm
2. useLoginMutation calls login({ email, password }) SA
3. login() SA:
   a. SELECT * FROM users WHERE email = input.email
   b. If no user: return { success: false, error: "Invalid email or password" }
   c. bcrypt.compare(input.password, user.password)
   d. If mismatch: return { success: false, error: "Invalid email or password" }
   e. Encode JWT (jose SignJWT, HS256, expiry = SESSION_EXPIRATION_TIME):
      payload = { user_id: user.id, email: user.email, role: user.role }
   f. Return { success: true, data: { access_token: jwt } }

4. Client receives access_token
5. createSession(access_token) SA called:
   a. decodeToken(token) → jose.decodeJwt(token)  ← SIGNATURE NOT VERIFIED
   b. Writes decoded payload to iron-session cookie:
      { isLoggedIn: true, userId: decoded.user_id, role: decoded.role }
   c. session.save()

6. Client reads returnTo cookie
7. router.replace(returnTo || "/dashboard")
8. returnTo cookie cleared
```

## Logout Flow

```
1. logout() SA called
2. destroySession() SA called → session.destroy()
3. Client redirects to /login
```

---

## Session Configuration

```typescript
// src/shared/lib/session.ts:
export const sessionOptions: SessionOptions = {
  password: env.SESSION_PASSWORD,     // AES encryption key (min 32 chars)
  cookieName: "session-cookie",
  cookieOptions: {
    maxAge: 8 * 60 * 60 * 1000 - 60 * 1000,  // ~8 hours
    secure: true,                               // ALWAYS — even on HTTP (breaks local dev)
  },
}
```

**Session payload**:
```typescript
type SessionData =
  | { isLoggedIn: false }
  | { isLoggedIn: true; userId: string; role: keyof typeof roleEnum }
```

---

## JWT Role

JWT is an intermediate transport step, not a persistent token:

| Step | Tool | Where |
|---|---|---|
| Sign JWT | `jose.SignJWT` (HS256) | `login()` SA |
| Decode JWT | `jose.decodeJwt()` | `createSession()` SA |
| Store session | iron-session encrypted cookie | `session.save()` |
| Read session | `getSession()` SA | Any server action needing auth |

JWT is created → immediately decoded → discarded. Only the iron-session cookie persists.

**Critical**: `jose.decodeJwt()` does NOT verify the signature. → `risks/security.md` for full impact.

---

## getSession()

```typescript
// session-manager/action.ts:
export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await _getSession()
  return JSON.parse(JSON.stringify(session))    // returns plain object, not IronSession instance
}
```

This returns a plain object typed as `IronSession<SessionData>`. It is NOT an actual IronSession instance — calling `.save()` on the return value would fail. All callers use it as read-only, which is safe.

---

## Middleware Pipeline

```typescript
// src/middleware.ts — runs on all matched routes:
const middlewares = [
  devOnlyGuard,       // block /design-system in non-dev environment
  authGuard,          // check session.isLoggedIn, redirect to /login if false
  redirectRules,      // / → /templates/onboarding, /dashboard → /dashboard/profile
  roleBasedAccess,    // for /dashboard/* routes: check role against tab access
]
```

Middleware order matters — each guard can redirect before later guards run.

Matched routes (from `middleware.ts` config.matcher):
```
/, /old, /editor/:path*, /design-system, /api/:path*, /dashboard/:path*
```

`/templates/*` is NOT in the matcher — middleware does not run on user-facing routes.

---

## returnTo Cookie

Set by `authGuard` when redirecting to login:

```typescript
// middlewares/auth-guard.ts:
response.cookies.set("returnTo", `${pathname}${search}`, {
  secure: process.env.NODE_ENV === "production",   // conditional (unlike session-cookie)
})
```

Read and cleared by client after login:
```typescript
const returnTo = getCookie("returnTo")  // from cookies-next
router.replace(returnTo || "/dashboard")
setCookie("returnTo", "")
```

**Inconsistency**: `returnTo` cookie uses `secure: prod only`, but `session-cookie` uses `secure: always`.

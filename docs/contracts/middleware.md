# Contracts: Middleware Guards

**Source**: `src/middleware.ts`, `src/middlewares/`
**Related**: → `flows/auth.md` (session mechanics) · → `entities/product-user.md` (role enum) · → `risks/security.md`

---

## Middleware Matcher

Middleware only executes on these route patterns (configured in `middleware.ts` config):

```typescript
matcher: [
  '/',
  '/old',
  '/editor/:path*',
  '/design-system',
  '/api/:path*',
  '/dashboard/:path*',
]
```

**NOT matched** (middleware never runs):
- `/login` — public, no protection needed
- `/templates/*` — user-facing, no middleware protection
- Any other unmatched route

Adding a new protected route requires updating BOTH the `matcher` AND `PROTECTED_ROUTES`. Missing either breaks protection.

---

## Guard Pipeline

Executed in order. Each guard can either: redirect (short-circuit) or call `next()` (continue to next guard).

```typescript
// src/middleware.ts:
[devOnlyGuard, authGuard, redirectRules, roleBasedAccess]
```

### 1. `devOnlyGuard`

```typescript
// middlewares/dev-only-guard.ts:
// Blocks /design-system in non-development environments
if (pathname.startsWith('/design-system') && NODE_ENV !== 'development') {
  return redirect('/login')
}
```

### 2. `authGuard`

```typescript
// middlewares/auth-guard.ts:
// Checks PROTECTED_ROUTES list
PROTECTED_ROUTES = [
  { path: /^\/dashboard/ },
  { path: /^\/editor\/[^\/]+\/edit$/ },   // /editor/:id/edit
  { path: /^\/editor\/create$/ },
  { path: /^\/design-system/ },
  { path: /^\/old/ },
]

if (routeIsProtected && !session.isLoggedIn) {
  set cookie "returnTo" = current path
  redirect to /login
}
```

### 3. `redirectRules`

```typescript
// middlewares/redirect-rules-guard.ts:
// Static redirects defined in constant.ts:
ROUTE_REDIRECTS = [
  { from: '/', to: '/templates/onboarding' },
  { from: '/dashboard', to: '/dashboard/profile' },
]
```

### 4. `roleBasedAccess`

```typescript
// middlewares/role-access-guard.ts:
// Only runs for /dashboard/* routes after auth check
import { tabsData } from "@/features/dashboard/data/tabs"  // ← feature import in middleware

const allowedTabs = tabsData[session.role]   // tabs for this role
const isAllowed = allowedTabs.some(tab => pathname.startsWith(tab.path))
if (!isAllowed) {
  redirect('/dashboard/profile')             // default fallback
}
```

**Coupling**: Middleware imports from `features/dashboard/data/tabs.ts`. Changes to `tabsData` structure directly affect middleware behavior. → `risks/fragile.md`

---

## PROTECTED_ROUTES vs Middleware Matcher

These two systems must be kept in sync:

| Route | In matcher? | In PROTECTED_ROUTES? | Effect |
|---|---|---|---|
| `/dashboard/*` | Yes | Yes | Middleware runs + auth enforced |
| `/editor/create` | Yes (`/editor/:path*`) | Yes | Middleware runs + auth enforced |
| `/editor/:id/edit` | Yes | Yes | Middleware runs + auth enforced |
| `/editor/:id` (view) | Yes | **No** | Middleware runs, auth NOT enforced |
| `/templates/*` | **No** | — | Middleware does NOT run |
| `/api/files/*` | Yes (`/api/:path*`) | **No** | Middleware runs, auth NOT enforced |
| `/login` | **No** | — | Middleware does NOT run |

---

## Role → Tab Access

Defined in `src/features/dashboard/data/tabs.ts`.
Role `1` (admin): subset of tabs.
Role `2` (superadmin): all tabs including user-management.

Server Actions do **not** use role to restrict access. Role enforcement exists only at the route/URL level via middleware. A role-1 admin can call any Server Action including user management mutations. → `risks/security.md`

---

## Session Read in Middleware

```typescript
// authGuard and roleBasedAccess read session via:
const session = await getIronSession<SessionData>(request, response, sessionOptions)
session.isLoggedIn   // boolean
session.role         // "admin" | "superadmin" | undefined
```

The iron-session cookie is decrypted on every middleware execution. No caching.

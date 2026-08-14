# Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication foundation for OTO's admin interface: Supabase Auth login, session-gated `/admin/*` routes, an `oto_admins` table, and two admin-account-management surfaces (`/admin/admins` for logged-in admins, `/dev/admins` as an env-and-key-gated bootstrap page).

**Architecture:** Next.js App Router with `@supabase/ssr` for cookie-based sessions (browser client, server client, and a service-role admin client). A shared `authorizeAdminRequest` helper accepts either an authenticated `oto_admins` session or a dev-setup key, so the two admin-management surfaces can call the same API routes. `middleware.ts` gates every `/admin/*` route; a nested layout under a `(protected)` route group re-checks server-side as a second layer, keeping `/admin/login` itself outside that guard.

**Tech Stack:** Next.js 16 (App Router, TypeScript strict), `@supabase/supabase-js`, `@supabase/ssr`, Vitest + Testing Library, Tailwind v4 (existing brand tokens).

**Spec:** `docs/superpowers/specs/2026-08-14-admin-foundation-design.md`

## Global Constraints

- Same Supabase project as Atunluto (project id `jgemycpdcmoebigmgorq`); every new table is `oto_`-prefixed and never touches Atunluto's existing `admins`, `site_content`, `gallery`, or other tables.
- Env var names must match Atunluto's exactly: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`), plus new `ADMIN_SETUP_ENABLED` and `ADMIN_SETUP_KEY` (both server-only).
- TypeScript strict mode and ESLint are the baseline gate (already configured).
- Tests use Vitest + Testing Library, matching `Nav.test.tsx` / `Footer.test.tsx` conventions: `vi.mock` calls before imports, `beforeEach` resets.
- Brand tokens only, no hardcoded colors: `bg-surface`, `text-ink`, `bg-brand-green`, `text-ink-inverse`, `text-brand-red`, `font-display`, `font-body` (confirmed against `app/globals.css`).
- No em dashes in any UI copy.
- `.env*` is already gitignored; never commit real secret values.

---

### Task 1: Supabase client wrappers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Test: `lib/supabase/client.test.ts`
- Test: `lib/supabase/server.test.ts`
- Test: `lib/supabase/admin.test.ts`

**Interfaces:**
- Produces: `createClient()` (browser, from `lib/supabase/client.ts`) returns a Supabase client synchronously.
- Produces: `createClient()` (server, from `lib/supabase/server.ts`, **async**) returns `Promise<SupabaseClient>`, reads/writes cookies via `next/headers`.
- Produces: `createAdminClient()` (from `lib/supabase/admin.ts`) returns a service-role Supabase client synchronously, no cookies, `autoRefreshToken: false`, `persistSession: false`.

- [ ] **Step 1: Install dependencies**

Run: `npm install @supabase/supabase-js @supabase/ssr`

- [ ] **Step 2: Write the failing tests**

`lib/supabase/admin.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const createClientMock = vi.fn(() => ({ mocked: "client" }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

import { createAdminClient } from "./admin";

beforeEach(() => {
  createClientMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

test("createAdminClient passes the service-role key, not the publishable key", () => {
  createAdminClient();
  expect(createClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-service-role-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
});
```

`lib/supabase/client.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ mocked: "browser-client" }));
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientMock(...args),
}));

import { createClient } from "./client";

beforeEach(() => {
  createBrowserClientMock.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("createClient passes the publishable key to createBrowserClient", () => {
  createClient();
  expect(createBrowserClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-publishable-key"
  );
});
```

`lib/supabase/server.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const createServerClientMock = vi.fn(() => ({ mocked: "server-client" }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}));

const cookiesMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

import { createClient } from "./server";

beforeEach(() => {
  createServerClientMock.mockClear();
  cookiesMock.mockReset().mockResolvedValue({
    getAll: () => [{ name: "sb-token", value: "abc" }],
    set: vi.fn(),
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("createClient passes the publishable key and wires cookies from next/headers", async () => {
  await createClient();
  expect(createServerClientMock).toHaveBeenCalledWith(
    "https://example.supabase.co",
    "test-publishable-key",
    expect.objectContaining({ cookies: expect.any(Object) })
  );
  const passedCookies = createServerClientMock.mock.calls[0][2].cookies;
  expect(passedCookies.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/supabase`
Expected: FAIL, "Cannot find module './admin'" (and `./client`, `./server`).

- [ ] **Step 4: Implement**

`lib/supabase/admin.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

`lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render; middleware refreshes the
            // session on the next request instead.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/supabase`
Expected: PASS (3 files, 3 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/supabase
git commit -m "feat: add Supabase client wrappers for admin auth"
```

---

### Task 2: Database migration for `oto_admins`

**Files:**
- Create: `supabase/oto-admins-schema.sql`

**Interfaces:**
- Produces: `public.oto_admins` table (`id uuid pk references auth.users`, `email text unique not null`, `display_name text`, `created_at timestamptz`, `created_by uuid references oto_admins`), RLS enabled, one SELECT policy for authenticated `oto_admins` members.

- [ ] **Step 1: Write the migration file**

`supabase/oto-admins-schema.sql`:
```sql
-- ═══════════════════════════════════════════════════════════════════════
-- OTO ADMINS
-- Dedicated to the OTO campaign site; lives in the same Supabase project as
-- Atunluto but never reads or writes Atunluto's own admins/site_content/
-- gallery tables. Applied via the Supabase MCP `apply_migration` tool.
-- ═══════════════════════════════════════════════════════════════════════

create table public.oto_admins (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.oto_admins(id)
);

alter table public.oto_admins enable row level security;

create policy "oto_admins_read_if_admin"
  on public.oto_admins
  for select
  to authenticated
  using (exists (select 1 from public.oto_admins a where a.id = auth.uid()));
```

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with `project_id: "jgemycpdcmoebigmgorq"`, `name: "create_oto_admins"`, and `query` set to the SQL above.

- [ ] **Step 3: Verify the table exists**

Call `mcp__supabase__list_tables` with `project_id: "jgemycpdcmoebigmgorq"`, `schemas: ["public"]`, `verbose: true`.
Expected: response includes `public.oto_admins` with columns `id, email, display_name, created_at, created_by`, `rls_enabled: true`, and Atunluto's existing tables (`admins`, `site_content`, `gallery`, `members`, `election_admins`, etc.) are unchanged.

- [ ] **Step 4: Check security advisors**

Call `mcp__supabase__get_advisors` with `project_id: "jgemycpdcmoebigmgorq"`, `type: "security"`.
Expected: no new advisory referencing `oto_admins` (RLS is enabled with a policy, so it should not be flagged as an RLS-disabled table).

- [ ] **Step 5: Commit**

```bash
git add supabase/oto-admins-schema.sql
git commit -m "feat: add oto_admins table and RLS policy"
```

---

### Task 3: Admin authorization helpers

**Files:**
- Create: `lib/admin/authorize.ts`
- Test: `lib/admin/authorize.test.ts`

**Interfaces:**
- Consumes: `createAdminClient()` from `lib/supabase/admin.ts`; `createClient()` (server, async) from `lib/supabase/server.ts`.
- Produces: `isOtoAdmin(userId: string): Promise<boolean>`. `authorizeAdminRequest(request: Request): Promise<AdminAuthorization>` where `AdminAuthorization = { authorized: true; actingAdminId: string | null } | { authorized: false }`. Both are consumed by Task 5 (middleware), Task 6 and 7 (API routes), and Task 10 (protected layout).

- [ ] **Step 1: Write the failing test**

`lib/admin/authorize.test.ts`:
```ts
import { beforeEach, describe, expect, test, vi } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));

import { authorizeAdminRequest, isOtoAdmin } from "./authorize";

beforeEach(() => {
  maybeSingleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
  getUserMock.mockReset();
  delete process.env.ADMIN_SETUP_ENABLED;
  delete process.env.ADMIN_SETUP_KEY;
});

describe("isOtoAdmin", () => {
  test("returns true when the user id exists in oto_admins", async () => {
    maybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    await expect(isOtoAdmin("user-1")).resolves.toBe(true);
    expect(fromMock).toHaveBeenCalledWith("oto_admins");
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
  });

  test("returns false when no matching row exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    await expect(isOtoAdmin("user-2")).resolves.toBe(false);
  });

  test("returns false on query error", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(isOtoAdmin("user-3")).resolves.toBe(false);
  });
});

describe("authorizeAdminRequest", () => {
  test("authorizes a logged-in oto_admin using their session", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingleMock.mockResolvedValue({ data: { id: "user-1" }, error: null });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: true, actingAdminId: "user-1" });
  });

  test("rejects a logged-in user who is not an oto_admin, with setup disabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });

  test("authorizes an anonymous request carrying the correct setup key when setup is enabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "correct-key" },
      })
    );
    expect(result).toEqual({ authorized: true, actingAdminId: null });
  });

  test("rejects an anonymous request with the wrong setup key", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    process.env.ADMIN_SETUP_ENABLED = "true";
    process.env.ADMIN_SETUP_KEY = "correct-key";
    const result = await authorizeAdminRequest(
      new Request("http://localhost/api/admin/admins", {
        headers: { "x-admin-setup-key": "wrong-key" },
      })
    );
    expect(result).toEqual({ authorized: false });
  });

  test("rejects an anonymous request when setup is not enabled", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const result = await authorizeAdminRequest(new Request("http://localhost/api/admin/admins"));
    expect(result).toEqual({ authorized: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/admin/authorize.test.ts`
Expected: FAIL, "Cannot find module './authorize'"

- [ ] **Step 3: Implement**

`lib/admin/authorize.ts`:
```ts
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuthorization =
  | { authorized: true; actingAdminId: string | null }
  | { authorized: false };

export async function isOtoAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return data !== null;
}

export async function authorizeAdminRequest(request: Request): Promise<AdminAuthorization> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (await isOtoAdmin(user.id))) {
    return { authorized: true, actingAdminId: user.id };
  }

  if (process.env.ADMIN_SETUP_ENABLED === "true") {
    const providedKey = request.headers.get("x-admin-setup-key");
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (providedKey && expectedKey && providedKey === expectedKey) {
      return { authorized: true, actingAdminId: null };
    }
  }

  return { authorized: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/admin/authorize.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/authorize.ts lib/admin/authorize.test.ts
git commit -m "feat: add oto_admins membership and request authorization helpers"
```

---

### Task 4: Password generator helper

**Files:**
- Create: `lib/admin/password.ts`
- Test: `lib/admin/password.test.ts`

**Interfaces:**
- Produces: `generateStrongPassword(): string`, a 16-character password, consumed by Task 8 (`AdminsManager`).

- [ ] **Step 1: Write the failing test**

`lib/admin/password.test.ts`:
```ts
import { expect, test } from "vitest";
import { generateStrongPassword } from "./password";

test("generates a 16-character password", () => {
  expect(generateStrongPassword()).toHaveLength(16);
});

test("only uses characters from the allowed set", () => {
  const password = generateStrongPassword();
  expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9!@#$%^&*]+$/);
});

test("generates different passwords across calls", () => {
  const passwords = new Set(Array.from({ length: 20 }, () => generateStrongPassword()));
  expect(passwords.size).toBeGreaterThan(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/admin/password.test.ts`
Expected: FAIL, "Cannot find module './password'"

- [ ] **Step 3: Implement**

`lib/admin/password.ts`:
```ts
const PASSWORD_LENGTH = 16;
// Excludes visually ambiguous characters (0/O, 1/l/I) so a generated
// password read aloud or retyped by hand is less error-prone.
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

export function generateStrongPassword(): string {
  const values = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join("");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/admin/password.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/password.ts lib/admin/password.test.ts
git commit -m "feat: add strong password generator for admin creation"
```

---

### Task 5: Middleware route protection

**Files:**
- Create: `middleware.ts`
- Test: `middleware.test.ts`

**Interfaces:**
- Consumes: `isOtoAdmin(userId: string): Promise<boolean>` from `lib/admin/authorize.ts`; `createServerClient` from `@supabase/ssr`.
- Produces: `middleware(request: NextRequest): Promise<NextResponse>`, redirecting unauthenticated/unauthorized visitors away from `/admin/*` (except `/admin/login`), and authorized admins away from `/admin/login`.

- [ ] **Step 1: Write the failing test**

`middleware.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: getUserMock } }),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import { middleware } from "./middleware";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
});

test("redirects an unauthenticated visitor away from a protected admin route", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  const response = await middleware(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin/login");
});

test("lets a logged-in oto_admin through to a protected route", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const response = await middleware(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(200);
});

test("redirects a logged-in non-admin away from a protected route", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
  isOtoAdminMock.mockResolvedValue(false);
  const response = await middleware(new NextRequest("http://localhost/admin/admins"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin/login");
});

test("redirects an already-authorized admin away from the login page", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const response = await middleware(new NextRequest("http://localhost/admin/login"));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost/admin");
});

test("lets an unauthenticated visitor reach the login page", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  const response = await middleware(new NextRequest("http://localhost/admin/login"));
  expect(response.status).toBe(200);
});

test("does not touch requests outside /admin", async () => {
  const response = await middleware(new NextRequest("http://localhost/gallery"));
  expect(response.status).toBe(200);
  expect(getUserMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run middleware.test.ts`
Expected: FAIL, "Cannot find module './middleware'"

- [ ] **Step 3: Implement**

`middleware.ts`:
```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isOtoAdmin } from "@/lib/admin/authorize";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthorized = user ? await isOtoAdmin(user.id) : false;
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    if (isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run middleware.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add middleware.ts middleware.test.ts
git commit -m "feat: gate /admin routes behind Supabase session and oto_admins membership"
```

---

### Task 6: Admin list/create API route

**Files:**
- Create: `app/api/admin/admins/route.ts`
- Test: `app/api/admin/admins/route.test.ts`

**Interfaces:**
- Consumes: `authorizeAdminRequest` from `lib/admin/authorize.ts`; `createAdminClient` from `lib/supabase/admin.ts`.
- Produces: `GET` returns `{ admins: Array<{ id, email, display_name, created_at }> }`. `POST` accepts `{ email, password, displayName? }`, returns `{ id, email, displayName }` with status 201. Consumed by Task 8 (`AdminsManager`).

- [ ] **Step 1: Write the failing test**

`app/api/admin/admins/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const orderMock = vi.fn();
const selectMock = vi.fn(() => ({ order: orderMock }));
const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }));
const createUserMock = vi.fn();
const deleteUserMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
    auth: { admin: { createUser: createUserMock, deleteUser: deleteUserMock } },
  }),
}));

import { GET, POST } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  orderMock.mockReset();
  selectMock.mockClear();
  insertMock.mockReset();
  fromMock.mockClear();
  createUserMock.mockReset();
  deleteUserMock.mockReset();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(401);
});

test("GET returns the admin list for an authorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({
    data: [{ id: "user-1", email: "a@b.com", display_name: "A", created_at: "2026-01-01" }],
    error: null,
  });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.admins).toHaveLength(1);
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
});

test("GET returns 500 on a query error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await GET(new Request("http://localhost/api/admin/admins"));
  expect(response.status).toBe(500);
});

test("POST rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "x" }),
    })
  );
  expect(response.status).toBe(401);
});

test("POST rejects a request missing email or password", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST creates the auth user and the oto_admins row", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  createUserMock.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
  insertMock.mockResolvedValue({ error: null });

  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "strong-pass", displayName: "New" }),
    })
  );

  expect(response.status).toBe(201);
  expect(createUserMock).toHaveBeenCalledWith({
    email: "new@b.com",
    password: "strong-pass",
    email_confirm: true,
  });
  expect(insertMock).toHaveBeenCalledWith({
    id: "new-user",
    email: "new@b.com",
    display_name: "New",
    created_by: "user-1",
  });
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("POST rolls back the auth user if the oto_admins insert fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  createUserMock.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
  insertMock.mockResolvedValue({ error: new Error("duplicate email") });

  const response = await POST(
    new Request("http://localhost/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ email: "new@b.com", password: "strong-pass" }),
    })
  );

  expect(response.status).toBe(500);
  expect(deleteUserMock).toHaveBeenCalledWith("new-user");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/admins/route.test.ts`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 3: Implement**

`app/api/admin/admins/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_admins")
    .select("id, email, display_name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: data });
}

export async function POST(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, displayName } = body as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user" },
      { status: 400 }
    );
  }

  const { error: insertError } = await adminClient.from("oto_admins").insert({
    id: createdUser.user.id,
    email,
    display_name: displayName ?? null,
    created_by: authz.actingAdminId,
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: createdUser.user.id, email, displayName: displayName ?? null },
    { status: 201 }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/admins/route.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/admins/route.ts app/api/admin/admins/route.test.ts
git commit -m "feat: add admin list/create API route"
```

---

### Task 7: Admin delete API route

**Files:**
- Create: `app/api/admin/admins/[id]/route.ts`
- Test: `app/api/admin/admins/[id]/route.test.ts`

**Interfaces:**
- Consumes: same as Task 6.
- Produces: `DELETE` returns `{ ok: true }` on success. Consumed by Task 8 (`AdminsManager`).

- [ ] **Step 1: Write the failing test**

`app/api/admin/admins/[id]/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const eqMock = vi.fn();
const deleteMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ delete: deleteMock }));
const deleteUserMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
    auth: { admin: { deleteUser: deleteUserMock } },
  }),
}));

import { DELETE } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  eqMock.mockReset();
  deleteMock.mockClear();
  fromMock.mockClear();
  deleteUserMock.mockReset();
});

test("rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await DELETE(new Request("http://localhost/api/admin/admins/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(401);
  expect(fromMock).not.toHaveBeenCalled();
});

test("deletes the oto_admins row and the auth user", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: null });
  deleteUserMock.mockResolvedValue({ error: null });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(200);
  expect(fromMock).toHaveBeenCalledWith("oto_admins");
  expect(eqMock).toHaveBeenCalledWith("id", "target");
  expect(deleteUserMock).toHaveBeenCalledWith("target");
});

test("returns 500 if deleting the row fails, and does not delete the auth user", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: new Error("row locked") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
  expect(deleteUserMock).not.toHaveBeenCalled();
});

test("returns 500 if deleting the auth user fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  eqMock.mockResolvedValue({ error: null });
  deleteUserMock.mockResolvedValue({ error: new Error("auth service down") });

  const response = await DELETE(new Request("http://localhost/api/admin/admins/target", { method: "DELETE" }), {
    params: Promise.resolve({ id: "target" }),
  });

  expect(response.status).toBe(500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/api/admin/admins/[id]/route.test.ts"`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 3: Implement**

`app/api/admin/admins/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { error: deleteRowError } = await adminClient.from("oto_admins").delete().eq("id", id);
  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(id);
  if (deleteUserError) {
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/api/admin/admins/[id]/route.test.ts"`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/admins/[id]/route.ts" "app/api/admin/admins/[id]/route.test.ts"
git commit -m "feat: add admin delete API route"
```

---

### Task 8: AdminsManager component

**Files:**
- Create: `components/admin/AdminsManager.tsx`
- Test: `components/admin/AdminsManager.test.tsx`

**Interfaces:**
- Consumes: `generateStrongPassword()` from `lib/admin/password.ts`; `fetch("/api/admin/admins")` (Task 6, 7).
- Produces: `AdminsManager({ extraHeaders?: Record<string, string> })` React component. Consumed by Task 11 (`/admin/admins`) and Task 12 (`/dev/admins`).

- [ ] **Step 1: Write the failing test**

`components/admin/AdminsManager.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminsManager } from "./AdminsManager";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("loads and displays the admin list on mount", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
    }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByText("Ada")).toBeInTheDocument();
  expect(screen.getByText("a@b.com")).toBeInTheDocument();
});

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<AdminsManager />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("submits the create form and reloads the list", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "2", email: "new@b.com" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "2", email: "new@b.com", display_name: null, created_at: "2026-01-02" }],
      }),
    });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "strong-pass" } });
  fireEvent.click(screen.getByText("Create admin"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const postCall = fetchMock.mock.calls[1];
  expect(postCall[0]).toBe("/api/admin/admins");
  expect(postCall[1].method).toBe("POST");
  expect(await screen.findByText("new@b.com")).toBeInTheDocument();
});

test("deletes an admin when Delete is clicked", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        admins: [{ id: "1", email: "a@b.com", display_name: "Ada", created_at: "2026-01-01" }],
      }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager />);
  await screen.findByText("Ada");

  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(fetchMock.mock.calls[1][0]).toBe("/api/admin/admins/1");
  expect(fetchMock.mock.calls[1][1].method).toBe("DELETE");
});

test("attaches extraHeaders to every request", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<AdminsManager extraHeaders={{ "x-admin-setup-key": "secret" }} />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][1]).toEqual(
    expect.objectContaining({ headers: { "x-admin-setup-key": "secret" } })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/AdminsManager.test.tsx`
Expected: FAIL, "Cannot find module './AdminsManager'"

- [ ] **Step 3: Implement**

`components/admin/AdminsManager.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { generateStrongPassword } from "@/lib/admin/password";

type AdminRecord = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

type AdminsManagerProps = {
  extraHeaders?: Record<string, string>;
};

export function AdminsManager({ extraHeaders = {} }: AdminsManagerProps) {
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAdmins = useCallback(async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/admins", { headers: extraHeaders });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to load admins");
      setStatus("error");
      return;
    }
    const body = await response.json();
    setAdmins(body.admins);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ email, password, displayName: displayName || undefined }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to create admin");
      return;
    }
    setEmail("");
    setPassword("");
    setDisplayName("");
    await loadAdmins();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/admins/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to delete admin");
      return;
    }
    await loadAdmins();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-body">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Password
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="flex-1 border border-ink/20 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setPassword(generateStrongPassword())}
              className="text-sm underline"
            >
              Generate
            </button>
          </div>
        </label>
        {errorMessage && (
          <p role="alert" className="text-sm text-brand-red">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create admin"}
        </button>
      </form>

      {status === "loading" && <p>Loading admins...</p>}

      <ul className="flex flex-col gap-3">
        {admins.map((admin) => (
          <li
            key={admin.id}
            className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3"
          >
            <div>
              <p className="font-body font-medium">{admin.display_name ?? admin.email}</p>
              <p className="text-sm text-ink/60">{admin.email}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(admin.id)}
              className="text-sm text-brand-red underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/AdminsManager.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminsManager.tsx components/admin/AdminsManager.test.tsx
git commit -m "feat: add shared admin list/create/delete manager component"
```

---

### Task 9: Login page

**Files:**
- Create: `app/admin/login/page.tsx`
- Test: `app/admin/login/page.test.tsx`

**Interfaces:**
- Consumes: `createClient()` (browser) from `lib/supabase/client.ts`; `useRouter` from `next/navigation`.
- Produces: default-exported `AdminLoginPage` component at `/admin/login`.

- [ ] **Step 1: Write the failing test**

`app/admin/login/page.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const signInWithPasswordMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPassword: signInWithPasswordMock } }),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import AdminLoginPage from "./page";

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
});

test("signs in and redirects to /admin on success", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: null });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
  fireEvent.click(screen.getByText("Sign in"));

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
  expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: "a@b.com", password: "secret" });
});

test("shows an error message on failed sign-in", async () => {
  signInWithPasswordMock.mockResolvedValue({ error: new Error("Invalid credentials") });
  render(<AdminLoginPage />);

  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
  fireEvent.click(screen.getByText("Sign in"));

  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  expect(pushMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/admin/login/page.test.tsx`
Expected: FAIL, "Cannot find module './page'"

- [ ] **Step 3: Implement**

`app/admin/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setErrorMessage("Incorrect email or password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Admin sign in</h1>
        <label className="flex flex-col gap-1 text-sm font-body">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        {errorMessage && (
          <p role="alert" className="text-sm text-brand-red">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/admin/login/page.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/admin/login
git commit -m "feat: add admin login page"
```

---

### Task 10: Protected layout and dashboard shell

**Files:**
- Create: `app/admin/(protected)/layout.tsx`
- Create: `app/admin/(protected)/page.tsx`
- Test: `app/admin/(protected)/layout.test.tsx`

**Interfaces:**
- Consumes: `createClient()` (server, async) from `lib/supabase/server.ts`; `isOtoAdmin` from `lib/admin/authorize.ts`; `redirect` from `next/navigation`.
- Produces: `AdminLayout({ children })` default export, redirects to `/admin/login` when not an authorized admin. `/admin` renders `AdminDashboardPage`. The `(protected)` route group keeps this guard off `/admin/login` (Task 9), since route groups do not add to the URL path.

- [ ] **Step 1: Write the failing test**

`app/admin/(protected)/layout.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";

const getUserMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));

const isOtoAdminMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  isOtoAdmin: (id: string) => isOtoAdminMock(id),
}));

import AdminLayout from "./layout";

beforeEach(() => {
  getUserMock.mockReset();
  isOtoAdminMock.mockReset();
});

test("redirects to login when there is no session", async () => {
  getUserMock.mockResolvedValue({ data: { user: null } });
  await expect(AdminLayout({ children: null })).rejects.toThrow();
});

test("redirects to login when the user is not an oto_admin", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-9" } } });
  isOtoAdminMock.mockResolvedValue(false);
  await expect(AdminLayout({ children: null })).rejects.toThrow();
});

test("renders children and nav links for an authorized admin", async () => {
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  isOtoAdminMock.mockResolvedValue(true);
  const result = await AdminLayout({ children: "protected content" });
  expect(result).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/admin/(protected)/layout.test.tsx"`
Expected: FAIL, "Cannot find module './layout'"

- [ ] **Step 3: Implement**

`app/admin/(protected)/layout.tsx`:
```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOtoAdmin } from "@/lib/admin/authorize";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isOtoAdmin(user.id))) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <p className="font-display text-lg font-semibold text-ink">OTO Admin</p>
        <nav className="flex gap-6 text-sm font-body">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/admins">Admins</Link>
        </nav>
      </header>
      <main className="px-6 py-10">{children}</main>
    </div>
  );
}
```

`app/admin/(protected)/page.tsx`:
```tsx
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="font-body text-ink/70">
        Content and Gallery management are on the way. For now, manage admin accounts from the
        Admins page.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/admin/(protected)/layout.test.tsx"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)"
git commit -m "feat: add protected admin layout and dashboard shell"
```

---

### Task 11: In-dashboard admins page

**Files:**
- Create: `app/admin/(protected)/admins/page.tsx`
- Test: `app/admin/(protected)/admins/page.test.tsx`

**Interfaces:**
- Consumes: `AdminsManager` from `components/admin/AdminsManager.tsx` (Task 8).
- Produces: default-exported `AdminAdminsPage` at `/admin/admins`.

- [ ] **Step 1: Write the failing test**

`app/admin/(protected)/admins/page.test.tsx`:
```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/admin/AdminsManager", () => ({
  AdminsManager: () => <div data-testid="admins-manager" />,
}));

import AdminAdminsPage from "./page";

test("renders a heading and the AdminsManager component", () => {
  render(<AdminAdminsPage />);
  expect(screen.getByText("Admins")).toBeInTheDocument();
  expect(screen.getByTestId("admins-manager")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/admin/(protected)/admins/page.test.tsx"`
Expected: FAIL, "Cannot find module './page'"

- [ ] **Step 3: Implement**

`app/admin/(protected)/admins/page.tsx`:
```tsx
import { AdminsManager } from "@/components/admin/AdminsManager";

export default function AdminAdminsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Admins</h1>
      <AdminsManager />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/admin/(protected)/admins/page.test.tsx"`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/admins"
git commit -m "feat: add in-dashboard admins management page"
```

---

### Task 12: Dev-only bootstrap page

**Files:**
- Create: `app/dev/admins/page.tsx`
- Create: `app/dev/admins/DevAdminSetup.tsx`
- Test: `app/dev/admins/page.test.tsx`
- Test: `app/dev/admins/DevAdminSetup.test.tsx`

**Interfaces:**
- Consumes: `AdminsManager` from `components/admin/AdminsManager.tsx` (Task 8); `process.env.ADMIN_SETUP_ENABLED`.
- Produces: `/dev/admins`, returning `notFound()` unless `ADMIN_SETUP_ENABLED === "true"`; `DevAdminSetup` gates on a typed-in key, then renders `AdminsManager` with `extraHeaders: { "x-admin-setup-key": <key> }`.

- [ ] **Step 1: Write the failing tests**

`app/dev/admins/page.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

vi.mock("./DevAdminSetup", () => ({
  DevAdminSetup: () => <div data-testid="dev-admin-setup" />,
}));

import DevAdminsPage from "./page";

beforeEach(() => {
  notFoundMock.mockClear();
  delete process.env.ADMIN_SETUP_ENABLED;
});

test("calls notFound when setup is not enabled", () => {
  expect(() => DevAdminsPage()).toThrow("NEXT_NOT_FOUND");
  expect(notFoundMock).toHaveBeenCalled();
});

test("renders the setup page when setup is enabled", () => {
  process.env.ADMIN_SETUP_ENABLED = "true";
  render(DevAdminsPage());
  expect(screen.getByTestId("dev-admin-setup")).toBeInTheDocument();
});
```

`app/dev/admins/DevAdminSetup.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DevAdminSetup } from "./DevAdminSetup";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("does not call the admins API until the setup key is submitted", () => {
  const fetchMock = vi.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  render(<DevAdminSetup />);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Setup key")).toBeInTheDocument();
});

test("sends the entered setup key as a header once unlocked", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ admins: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<DevAdminSetup />);
  fireEvent.change(screen.getByLabelText("Setup key"), { target: { value: "my-secret" } });
  fireEvent.click(screen.getByText("Continue"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [, options] = fetchMock.mock.calls[0];
  expect(options.headers["x-admin-setup-key"]).toBe("my-secret");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/dev/admins`
Expected: FAIL, "Cannot find module './page'" / "Cannot find module './DevAdminSetup'"

- [ ] **Step 3: Implement**

`app/dev/admins/DevAdminSetup.tsx`:
```tsx
"use client";

import { useState } from "react";
import { AdminsManager } from "@/components/admin/AdminsManager";

export function DevAdminSetup() {
  const [setupKey, setSetupKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setUnlocked(true);
        }}
        className="flex max-w-sm flex-col gap-4"
      >
        <label className="flex flex-col gap-1 text-sm font-body">
          Setup key
          <input
            type="password"
            required
            value={setupKey}
            onChange={(event) => setSetupKey(event.target.value)}
            className="border border-ink/20 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse"
        >
          Continue
        </button>
      </form>
    );
  }

  return <AdminsManager extraHeaders={{ "x-admin-setup-key": setupKey }} />;
}
```

`app/dev/admins/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { DevAdminSetup } from "./DevAdminSetup";

export default function DevAdminsPage() {
  if (process.env.ADMIN_SETUP_ENABLED !== "true") {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-surface px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Admin setup</h1>
      <DevAdminSetup />
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/dev/admins`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/dev/admins
git commit -m "feat: add env-and-key-gated dev admin bootstrap page"
```

---

### Task 13: Environment setup and manual end-to-end verification

**Files:**
- Modify: `.env.local` (not committed, gitignored)

**Interfaces:** None (verification task).

- [ ] **Step 1: Set local environment variables**

Add to `.env.local` (create if absent):
```
NEXT_PUBLIC_SUPABASE_URL=https://jgemycpdcmoebigmgorq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_iJpna60G11IvxKb8FV_hAA_zqqHxMQZ
SUPABASE_SERVICE_ROLE_KEY=<copy the value from atunluto/.env.local — same project, same key>
ADMIN_SETUP_ENABLED=true
ADMIN_SETUP_KEY=<any long random string, used only during this bootstrap>
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including every test file added in Tasks 1 through 12.

- [ ] **Step 3: Run the type checker and linter**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Start the dev server and bootstrap the first admin**

Run: `npm run dev`
Visit `http://localhost:3000/dev/admins`, enter the `ADMIN_SETUP_KEY` from Step 1, then use the form to create the first real admin account with a real email and a generated password (save the password somewhere safe, it is only shown once here).

- [ ] **Step 5: Verify login and route protection by hand**

- Visit `http://localhost:3000/admin` while logged out: confirm redirect to `/admin/login`.
- Log in at `/admin/login` with the account from Step 4: confirm redirect to `/admin`, dashboard renders, nav shows Dashboard and Admins.
- Visit `/admin/admins`: confirm the admin created in Step 4 appears in the list.
- Create a second admin from `/admin/admins`, confirm it appears; delete it, confirm it disappears.
- Visit `/admin/login` while still logged in: confirm redirect back to `/admin`.

- [ ] **Step 6: Screenshot for UI sign-off**

Per project convention (`feedback_ui_signoff` memory), capture screenshots of `/admin/login`, `/admin` (dashboard), and `/admin/admins` (with at least one admin listed) and share with the client before considering this plan's UI complete.

- [ ] **Step 7: Turn off setup mode**

Set `ADMIN_SETUP_ENABLED=false` (or remove the line) in `.env.local` now that the first admin exists, and confirm `http://localhost:3000/dev/admins` now 404s.

- [ ] **Step 8: Document production environment variables**

Note for the next Plesk deployment session (not executed here): the same five environment variables from Step 1 need to be set in Plesk's Node.js "Custom Environment Variables" panel for `otosenate2027.com`, with `ADMIN_SETUP_ENABLED` left unset in production once the first production admin exists, matching the deployment runbook from earlier in this engagement.

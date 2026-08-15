# Gallery and Cloudinary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the public gallery page to real content and give admins a way to manage it: an `oto_gallery` table, a Cloudinary integration reusing Atunluto's own account, an admin gallery management page (upload, delete, caption edit), and a one-time migration of the 124 files currently in `public/gallery/`.

**Architecture:** Direct-to-Cloudinary signed uploads (the browser uploads straight to Cloudinary; the Next.js server only mints a short-lived signature and never touches the file bytes), mirroring Atunluto's own working pattern. Deletes are server-proxied, since destroying a Cloudinary asset needs the API secret. `oto_gallery` is public-readable (RLS `select` open to `anon`/`authenticated`); all writes go through the same `authorizeAdminRequest` gate the admin foundation already built, via the service-role client.

**Tech Stack:** Next.js 16 (App Router, TypeScript strict), `cloudinary` (server SDK), the existing `@supabase/supabase-js` / `@supabase/ssr` stack, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-15-gallery-cloudinary-design.md`

## Global Constraints

- Same Supabase project as Atunluto and the OTO admin foundation (project id `jgemycpdcmoebigmgorq`); `oto_gallery` is `oto_`-prefixed, never touches Atunluto's own `gallery` table.
- Same Cloudinary account as Atunluto (the client's explicit instruction), scoped under a new `oto-gallery` folder. Env var names must match Atunluto's exactly: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (all server-only).
- Reuse `authorizeAdminRequest` (`lib/admin/authorize.ts`) for every write path. Do not reimplement gating logic.
- TypeScript strict mode and ESLint (including `eslint-plugin-react-hooks` v7 — any new `useEffect` that ends up setting state must route through `queueMicrotask(...)`, not a direct call, per the pattern already established in `AdminsManager.tsx`) are the baseline gate.
- Tests use Vitest + Testing Library, matching `AdminsManager.test.tsx` / `app/api/admin/admins/route.test.ts` conventions: `vi.mock` calls before imports, `beforeEach` resets.
- Brand tokens only, no hardcoded colors, no em dashes in copy.
- No dual-image-upload pattern: one uploaded image per photo; thumbnails and video posters are Cloudinary URL transforms, not separate uploads.

---

### Task 1: Cloudinary integration module

**Files:**
- Create: `lib/cloudinary.ts`
- Test: `lib/cloudinary.test.ts`

**Interfaces:**
- Produces: `cloudinary` (configured `cloudinary.v2` SDK instance, re-exported), `signUpload(folder: string): { signature, timestamp, folder, cloudName, apiKey }`, `buildPosterUrl(publicId: string): string`. Consumed by Task 3 (sign route), Task 6 (delete route), Task 9 (public wiring), Task 10 (migration script).

- [ ] **Step 1: Install the dependency**

Run: `npm install cloudinary`

- [ ] **Step 2: Write the failing test**

`lib/cloudinary.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: vi.fn(() => "test-signature") },
  },
}));

import { buildPosterUrl, signUpload } from "./cloudinary";

beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
});

test("buildPosterUrl builds a poster frame URL from a public id", () => {
  expect(buildPosterUrl("oto-gallery/my-video")).toBe(
    "https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/oto-gallery/my-video.jpg"
  );
});

test("signUpload returns a signature, timestamp, folder, cloud name, and api key", () => {
  const result = signUpload("oto-gallery");
  expect(result.folder).toBe("oto-gallery");
  expect(result.signature).toBe("test-signature");
  expect(result.cloudName).toBe("test-cloud");
  expect(result.apiKey).toBe("test-key");
  expect(typeof result.timestamp).toBe("number");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/cloudinary.test.ts`
Expected: FAIL, "Cannot find module './cloudinary'"

- [ ] **Step 4: Implement**

`lib/cloudinary.ts`:
```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function signUpload(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

export function buildPosterUrl(publicId: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/${publicId}.jpg`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/cloudinary.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/cloudinary.ts lib/cloudinary.test.ts
git commit -m "feat: add Cloudinary integration module"
```

---

### Task 2: Database migration for `oto_gallery`

**Files:**
- Create: `supabase/oto-gallery-schema.sql`

**Interfaces:**
- Produces: `public.oto_gallery` table (`id uuid pk`, `media_type text` check `image`/`video`, `url text not null`, `duration_seconds numeric`, `caption text not null default ''`, `storage_path text not null`, `uploaded_by uuid references oto_admins`, `created_at timestamptz`). RLS enabled, public `select` policy.

- [ ] **Step 1: Write the migration file**

`supabase/oto-gallery-schema.sql`:
```sql
-- ═══════════════════════════════════════════════════════════════════════
-- OTO GALLERY
-- Dedicated to the OTO campaign site; lives in the same Supabase project
-- (and the same Cloudinary account) as Atunluto, but never reads or writes
-- Atunluto's own gallery table. Applied via the Supabase MCP
-- `apply_migration` tool.
-- ═══════════════════════════════════════════════════════════════════════

create table public.oto_gallery (
  id                uuid primary key default gen_random_uuid(),
  media_type        text not null check (media_type in ('image', 'video')),
  url               text not null,
  duration_seconds  numeric,
  caption           text not null default '',
  storage_path      text not null,
  uploaded_by       uuid references public.oto_admins(id) on delete set null,
  created_at        timestamptz not null default now()
);

alter table public.oto_gallery enable row level security;

-- Public website: anyone (including anonymous visitors) may read gallery content.
create policy "oto_gallery_public_read"
  on public.oto_gallery
  for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Apply the migration**

Call `mcp__supabase__apply_migration` with `project_id: "jgemycpdcmoebigmgorq"`, `name: "create_oto_gallery"`, and `query` set to the SQL above.

- [ ] **Step 3: Verify the table exists**

Call `mcp__supabase__list_tables` with `project_id: "jgemycpdcmoebigmgorq"`, `schemas: ["public"]`, `verbose: true`.
Expected: response includes `public.oto_gallery` with the columns above, `rls_enabled: true`, and every other existing table (Atunluto's and `oto_admins`) unchanged.

- [ ] **Step 4: Check security advisors**

Call `mcp__supabase__get_advisors` with `project_id: "jgemycpdcmoebigmgorq"`, `type: "security"`.
Expected: no new advisory referencing `oto_gallery`.

- [ ] **Step 5: Commit**

```bash
git add supabase/oto-gallery-schema.sql
git commit -m "feat: add oto_gallery table and public-read RLS policy"
```

---

### Task 3: Sign-upload route

**Files:**
- Create: `app/api/admin/gallery/sign/route.ts`
- Test: `app/api/admin/gallery/sign/route.test.ts`

**Interfaces:**
- Consumes: `authorizeAdminRequest` from `lib/admin/authorize.ts`; `signUpload` from `lib/cloudinary.ts` (Task 1).
- Produces: `GET` returns `{ signature, timestamp, folder, cloudName, apiKey }` for the `oto-gallery` folder. Consumed by Task 7 (`GalleryManager`).

- [ ] **Step 1: Write the failing test**

`app/api/admin/gallery/sign/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const signUploadMock = vi.fn();
vi.mock("@/lib/cloudinary", () => ({
  signUpload: (folder: string) => signUploadMock(folder),
}));

import { GET } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  signUploadMock.mockReset();
});

test("rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign"));
  expect(response.status).toBe(401);
  expect(signUploadMock).not.toHaveBeenCalled();
});

test("signs an upload for the oto-gallery folder", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  signUploadMock.mockReturnValue({
    signature: "sig",
    timestamp: 123,
    folder: "oto-gallery",
    cloudName: "test-cloud",
    apiKey: "test-key",
  });
  const response = await GET(new Request("http://localhost/api/admin/gallery/sign"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toEqual({
    signature: "sig",
    timestamp: 123,
    folder: "oto-gallery",
    cloudName: "test-cloud",
    apiKey: "test-key",
  });
  expect(signUploadMock).toHaveBeenCalledWith("oto-gallery");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/gallery/sign/route.test.ts`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 3: Implement**

`app/api/admin/gallery/sign/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { signUpload } from "@/lib/cloudinary";

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(signUpload("oto-gallery"));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/gallery/sign/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/gallery/sign
git commit -m "feat: add gallery upload signing route"
```

---

### Task 4: `GalleryItem` type extension and poster wiring

**Files:**
- Modify: `content/gallery.ts`
- Modify: `components/sections/GalleryItemCard.tsx`
- Modify: `components/sections/GalleryItemCard.test.tsx`

**Interfaces:**
- Produces: `GalleryItem` gains `posterUrl?: string`. `GalleryItemCard` renders `<video poster={item.posterUrl}>`. Consumed by Task 7 (`GalleryManager` list rendering assumptions), Task 9 (real `getGalleryItems()` populates `posterUrl`).

- [ ] **Step 1: Write the failing test**

Add to `components/sections/GalleryItemCard.test.tsx` (keep the existing two tests unchanged, add this one):
```tsx
test("sets the poster attribute for a video with a posterUrl", () => {
  const videoItem: GalleryItem = {
    id: "2",
    type: "video",
    url: "/test-video.mp4",
    posterUrl: "/test-poster.jpg",
    caption: "Campaign launch",
    createdAt: "2026-01-01",
  };
  const { container } = render(<GalleryItemCard item={videoItem} />);
  const video = container.querySelector("video");
  expect(video).toHaveAttribute("poster", "/test-poster.jpg");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/sections/GalleryItemCard.test.tsx`
Expected: FAIL — `posterUrl` does not exist on type `GalleryItem` (TypeScript), or the rendered `<video>` has no `poster` attribute.

- [ ] **Step 3: Implement**

In `content/gallery.ts`, change only the type (leave `getGalleryItems()` returning `[]` for now — Task 9 implements it for real):
```ts
export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return [];
}
```

In `components/sections/GalleryItemCard.tsx`, add the `poster` attribute to the existing `<video>` element:
```tsx
<video
  src={item.url}
  poster={item.posterUrl}
  className="h-full w-full object-cover"
  controls
  onError={() => setFailed(true)}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/sections/GalleryItemCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add content/gallery.ts components/sections/GalleryItemCard.tsx components/sections/GalleryItemCard.test.tsx
git commit -m "feat: add posterUrl to GalleryItem and wire it into the video poster"
```

---

### Task 5: Gallery list/create API route

**Files:**
- Create: `app/api/admin/gallery/route.ts`
- Test: `app/api/admin/gallery/route.test.ts`

**Interfaces:**
- Consumes: `authorizeAdminRequest` from `lib/admin/authorize.ts`; `createAdminClient` from `lib/supabase/admin.ts`.
- Produces: `GET` returns `{ items: Array<{id, media_type, url, duration_seconds, caption, storage_path, created_at}> }`. `POST` accepts `{url, storagePath, mediaType, durationSeconds?, caption?}`, returns `{ item }` with status 201. Consumed by Task 7 (`GalleryManager`).

- [ ] **Step 1: Write the failing test**

`app/api/admin/gallery/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const orderMock = vi.fn();
const selectListMock = vi.fn(() => ({ order: orderMock }));
const singleMock = vi.fn();
const selectInsertMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: selectInsertMock }));
const fromMock = vi.fn(() => ({ select: selectListMock, insert: insertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { GET, POST } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  orderMock.mockReset();
  selectListMock.mockClear();
  singleMock.mockReset();
  selectInsertMock.mockClear();
  insertMock.mockClear();
  fromMock.mockClear();
});

test("GET rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(401);
});

test("GET returns the gallery list for an authorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({
    data: [
      {
        id: "1",
        media_type: "image",
        url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/y.jpg",
        duration_seconds: null,
        caption: "",
        storage_path: "oto-gallery/y",
        created_at: "2026-01-01",
      },
    ],
    error: null,
  });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.items).toHaveLength(1);
  expect(fromMock).toHaveBeenCalledWith("oto_gallery");
});

test("GET returns 500 on a query error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  const response = await GET(new Request("http://localhost/api/admin/gallery"));
  expect(response.status).toBe(500);
});

test("POST rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "image" }),
    })
  );
  expect(response.status).toBe(401);
});

test("POST rejects a request missing required fields", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST rejects an invalid mediaType", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "audio" }),
    })
  );
  expect(response.status).toBe(400);
});

test("POST inserts a new gallery row", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({
    data: {
      id: "2",
      media_type: "image",
      url: "https://x/y.jpg",
      duration_seconds: null,
      caption: "Rally",
      storage_path: "oto-gallery/y",
      created_at: "2026-01-02",
    },
    error: null,
  });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({
        url: "https://x/y.jpg",
        storagePath: "oto-gallery/y",
        mediaType: "image",
        caption: "Rally",
      }),
    })
  );
  expect(response.status).toBe(201);
  expect(insertMock).toHaveBeenCalledWith({
    url: "https://x/y.jpg",
    storage_path: "oto-gallery/y",
    media_type: "image",
    duration_seconds: null,
    caption: "Rally",
    uploaded_by: "user-1",
  });
});

test("POST returns 500 on insert error", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  singleMock.mockResolvedValue({ data: null, error: new Error("db error") });
  const response = await POST(
    new Request("http://localhost/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify({ url: "https://x/y.jpg", storagePath: "oto-gallery/y", mediaType: "image" }),
    })
  );
  expect(response.status).toBe(500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/admin/gallery/route.test.ts`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 3: Implement**

`app/api/admin/gallery/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

const GALLERY_FIELDS = "id, media_type, url, duration_seconds, caption, storage_path, created_at";

export async function GET(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .select(GALLERY_FIELDS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, storagePath, mediaType, durationSeconds, caption } = body as {
    url?: string;
    storagePath?: string;
    mediaType?: string;
    durationSeconds?: number;
    caption?: string;
  };

  if (!url || !storagePath || (mediaType !== "image" && mediaType !== "video")) {
    return NextResponse.json(
      { error: "url, storagePath, and a valid mediaType are required" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .insert({
      url,
      storage_path: storagePath,
      media_type: mediaType,
      duration_seconds: durationSeconds ?? null,
      caption: caption ?? "",
      uploaded_by: authz.actingAdminId,
    })
    .select(GALLERY_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/admin/gallery/route.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/gallery/route.ts app/api/admin/gallery/route.test.ts
git commit -m "feat: add gallery list/create API route"
```

---

### Task 6: Gallery update/delete API route

**Files:**
- Create: `app/api/admin/gallery/[id]/route.ts`
- Test: `app/api/admin/gallery/[id]/route.test.ts`

**Interfaces:**
- Consumes: `authorizeAdminRequest` (Task 3 pattern), `createAdminClient`, `cloudinary` from `lib/cloudinary.ts` (Task 1).
- Produces: `PATCH` accepts `{caption}`, returns `{item}` or 404. `DELETE` returns `{ok: true}` or 404; deletes the Cloudinary asset only after confirming a row was genuinely deleted. Consumed by Task 7 (`GalleryManager`).

- [ ] **Step 1: Write the failing test**

`app/api/admin/gallery/[id]/route.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const authorizeAdminRequestMock = vi.fn();
vi.mock("@/lib/admin/authorize", () => ({
  authorizeAdminRequest: (request: Request) => authorizeAdminRequestMock(request),
}));

const maybeSingleMock = vi.fn();
const selectUpdateMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const eqUpdateMock = vi.fn(() => ({ select: selectUpdateMock }));
const updateMock = vi.fn(() => ({ eq: eqUpdateMock }));

const selectDeleteMock = vi.fn();
const eqDeleteMock = vi.fn(() => ({ select: selectDeleteMock }));
const deleteMock = vi.fn(() => ({ eq: eqDeleteMock }));

const fromMock = vi.fn(() => ({ update: updateMock, delete: deleteMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

const destroyMock = vi.fn();
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { uploader: { destroy: (...args: unknown[]) => destroyMock(...args) } },
}));

import { DELETE, PATCH } from "./route";

beforeEach(() => {
  authorizeAdminRequestMock.mockReset();
  maybeSingleMock.mockReset();
  selectUpdateMock.mockClear();
  eqUpdateMock.mockClear();
  updateMock.mockClear();
  selectDeleteMock.mockReset();
  eqDeleteMock.mockClear();
  deleteMock.mockClear();
  fromMock.mockClear();
  destroyMock.mockReset();
});

test("PATCH rejects an unauthorized caller", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", {
      method: "PATCH",
      body: JSON.stringify({ caption: "x" }),
    }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(401);
});

test("PATCH rejects a missing caption", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", { method: "PATCH", body: JSON.stringify({}) }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(400);
});

test("PATCH updates the caption", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({
    data: {
      id: "1",
      media_type: "image",
      url: "https://x/y.jpg",
      duration_seconds: null,
      caption: "New caption",
      storage_path: "oto-gallery/y",
      created_at: "2026-01-01",
    },
    error: null,
  });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/1", {
      method: "PATCH",
      body: JSON.stringify({ caption: "New caption" }),
    }),
    { params: Promise.resolve({ id: "1" }) }
  );
  expect(response.status).toBe(200);
  expect(updateMock).toHaveBeenCalledWith({ caption: "New caption" });
  expect(eqUpdateMock).toHaveBeenCalledWith("id", "1");
});

test("PATCH returns 404 when the item does not exist", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  maybeSingleMock.mockResolvedValue({ data: null, error: null });
  const response = await PATCH(
    new Request("http://localhost/api/admin/gallery/missing", {
      method: "PATCH",
      body: JSON.stringify({ caption: "x" }),
    }),
    { params: Promise.resolve({ id: "missing" }) }
  );
  expect(response.status).toBe(404);
});

test("DELETE rejects an unauthorized caller and never touches the database", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: false });
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(401);
  expect(fromMock).not.toHaveBeenCalled();
});

test("DELETE returns 404 and never calls Cloudinary if nothing matched", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({ data: [], error: null });
  const response = await DELETE(
    new Request("http://localhost/api/admin/gallery/missing", { method: "DELETE" }),
    { params: Promise.resolve({ id: "missing" }) }
  );
  expect(response.status).toBe(404);
  expect(destroyMock).not.toHaveBeenCalled();
});

test("DELETE removes the row and the Cloudinary asset with the right resource type", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({
    data: [{ storage_path: "oto-gallery/y", media_type: "video" }],
    error: null,
  });
  destroyMock.mockResolvedValue({ result: "ok" });
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(200);
  expect(destroyMock).toHaveBeenCalledWith("oto-gallery/y", { resource_type: "video" });
});

test("DELETE still returns ok if the Cloudinary cleanup fails", async () => {
  authorizeAdminRequestMock.mockResolvedValue({ authorized: true, actingAdminId: "user-1" });
  selectDeleteMock.mockResolvedValue({
    data: [{ storage_path: "oto-gallery/y", media_type: "image" }],
    error: null,
  });
  destroyMock.mockRejectedValue(new Error("cloudinary down"));
  const response = await DELETE(new Request("http://localhost/api/admin/gallery/1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "1" }),
  });
  expect(response.status).toBe(200);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/api/admin/gallery/[id]/route.test.ts"`
Expected: FAIL, "Cannot find module './route'"

- [ ] **Step 3: Implement**

`app/api/admin/gallery/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import { cloudinary } from "@/lib/cloudinary";

const GALLERY_FIELDS = "id, media_type, url, duration_seconds, caption, storage_path, created_at";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { caption } = body as { caption?: string };

  if (typeof caption !== "string") {
    return NextResponse.json({ error: "caption is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("oto_gallery")
    .update({ caption })
    .eq("id", id)
    .select(GALLERY_FIELDS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authz = await authorizeAdminRequest(request);
  if (!authz.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: deletedRows, error: deleteRowError } = await adminClient
    .from("oto_gallery")
    .delete()
    .eq("id", id)
    .select("storage_path, media_type");

  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
  }

  const [deletedItem] = deletedRows;
  const resourceType = deletedItem.media_type === "video" ? "video" : "image";

  try {
    await cloudinary.uploader.destroy(deletedItem.storage_path, { resource_type: resourceType });
  } catch (cloudinaryError) {
    console.error(`Failed to delete Cloudinary asset ${deletedItem.storage_path}:`, cloudinaryError);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/api/admin/gallery/[id]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/api/admin/gallery/[id]/route.ts" "app/api/admin/gallery/[id]/route.test.ts"
git commit -m "feat: add gallery caption-update and delete API route"
```

---

### Task 7: GalleryManager component

**Files:**
- Create: `components/admin/GalleryManager.tsx`
- Test: `components/admin/GalleryManager.test.tsx`

**Interfaces:**
- Consumes: `fetch("/api/admin/gallery/sign")` (Task 3), `fetch("/api/admin/gallery")` GET/POST (Task 5), `fetch("/api/admin/gallery/{id}")` PATCH/DELETE (Task 6), and Cloudinary's own upload endpoint directly.
- Produces: `GalleryManager({ extraHeaders?: Record<string, string> })` React component. Consumed by Task 8 (`/admin/gallery` page).

- [ ] **Step 1: Write the failing test**

`components/admin/GalleryManager.test.tsx`:
```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryManager } from "./GalleryManager";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("loads and displays gallery items on mount", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          id: "1",
          media_type: "image",
          url: "https://x/y.jpg",
          duration_seconds: null,
          caption: "Rally",
          storage_path: "oto-gallery/y",
          created_at: "2026-01-01",
        },
      ],
    }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByText("Rally")).toBeInTheDocument();
});

test("shows the load error when the list request fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Unauthorized" }),
  }) as unknown as typeof fetch;

  render(<GalleryManager />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized");
});

test("uploads a file: signs, uploads to Cloudinary, creates the row, then reloads", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    }
    if (url === "/api/admin/gallery/sign") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          signature: "sig",
          timestamp: 123,
          folder: "oto-gallery",
          cloudName: "test-cloud",
          apiKey: "test-key",
        }),
      });
    }
    if (url.startsWith("https://api.cloudinary.com/")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          secure_url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/photo.jpg",
          public_id: "oto-gallery/photo",
        }),
      });
    }
    if (url === "/api/admin/gallery" && init?.method === "POST") {
      return Promise.resolve({ ok: true, json: async () => ({ item: { id: "2" } }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

  const file = new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("Photo or video"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "Campaign stop" } });
  fireEvent.click(screen.getByText("Upload"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));

  const cloudinaryCall = fetchMock.mock.calls.find(([url]) => String(url).startsWith("https://api.cloudinary.com/"));
  expect(cloudinaryCall?.[0]).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");

  const createCall = fetchMock.mock.calls.find(
    ([url, init]) => url === "/api/admin/gallery" && init?.method === "POST"
  );
  expect(createCall).toBeTruthy();
  const createBody = JSON.parse((createCall![1] as RequestInit).body as string);
  expect(createBody).toMatchObject({
    url: "https://res.cloudinary.com/test-cloud/image/upload/oto-gallery/photo.jpg",
    storagePath: "oto-gallery/photo",
    mediaType: "image",
    caption: "Campaign stop",
  });
});

test("does not delete when the confirmation is cancelled", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          id: "1",
          media_type: "image",
          url: "https://x/y.jpg",
          duration_seconds: null,
          caption: "Rally",
          storage_path: "oto-gallery/y",
          created_at: "2026-01-01",
        },
      ],
    }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
});

test("deletes a gallery item after confirmation", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              media_type: "image",
              url: "https://x/y.jpg",
              duration_seconds: null,
              caption: "Rally",
              storage_path: "oto-gallery/y",
              created_at: "2026-01-01",
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "DELETE") {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Rally");
  fireEvent.click(screen.getByText("Delete"));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});

test("edits and saves a caption", async () => {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === "/api/admin/gallery" && (!init || init.method === undefined)) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "1",
              media_type: "image",
              url: "https://x/y.jpg",
              duration_seconds: null,
              caption: "Old caption",
              storage_path: "oto-gallery/y",
              created_at: "2026-01-01",
            },
          ],
        }),
      });
    }
    if (url === "/api/admin/gallery/1" && init?.method === "PATCH") {
      return Promise.resolve({ ok: true, json: async () => ({ item: { id: "1", caption: "New caption" } }) });
    }
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
  global.fetch = fetchMock as unknown as typeof fetch;

  render(<GalleryManager />);
  await screen.findByText("Old caption");

  fireEvent.click(screen.getByText("Edit caption"));
  fireEvent.change(screen.getByDisplayValue("Old caption"), { target: { value: "New caption" } });
  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => {
    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) => url === "/api/admin/gallery/1" && init?.method === "PATCH"
    );
    expect(patchCall).toBeTruthy();
  });
  const patchCall = fetchMock.mock.calls.find(
    ([url, init]) => url === "/api/admin/gallery/1" && init?.method === "PATCH"
  );
  const patchBody = JSON.parse((patchCall![1] as RequestInit).body as string);
  expect(patchBody).toEqual({ caption: "New caption" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/admin/GalleryManager.test.tsx`
Expected: FAIL, "Cannot find module './GalleryManager'"

- [ ] **Step 3: Implement**

`components/admin/GalleryManager.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type GalleryRecord = {
  id: string;
  media_type: "image" | "video";
  url: string;
  duration_seconds: number | null;
  caption: string;
  storage_path: string;
  created_at: string;
};

type SignedUpload = {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type GalleryManagerProps = {
  extraHeaders?: Record<string, string>;
};

async function uploadToCloudinary(file: File, signed: SignedUpload, resourceType: "image" | "video") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload to Cloudinary failed");
  }

  return response.json() as Promise<{ secure_url: string; public_id: string; duration?: number }>;
}

export function GalleryManager({ extraHeaders = {} }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/admin/gallery", { headers: extraHeaders });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to load gallery items");
      setStatus("error");
      return;
    }
    const body = await response.json();
    setItems(body.items);
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    queueMicrotask(loadItems);
  }, [loadItems]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setErrorMessage("");

    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    try {
      const signResponse = await fetch("/api/admin/gallery/sign", { headers: extraHeaders });
      if (!signResponse.ok) {
        throw new Error("Failed to sign upload");
      }
      const signed = (await signResponse.json()) as SignedUpload;

      const uploaded = await uploadToCloudinary(file, signed, mediaType);

      const createResponse = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify({
          url: uploaded.secure_url,
          storagePath: uploaded.public_id,
          mediaType,
          durationSeconds: uploaded.duration ?? undefined,
          caption,
        }),
      });
      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save gallery item");
      }

      setFile(null);
      setCaption("");
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this gallery item? This cannot be undone.")) {
      return;
    }
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "DELETE",
      headers: extraHeaders,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to delete gallery item");
      return;
    }
    await loadItems();
  }

  function startEditing(item: GalleryRecord) {
    setEditingId(item.id);
    setEditingCaption(item.caption);
  }

  async function saveCaption(id: string) {
    const response = await fetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ caption: editingCaption }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setErrorMessage(body.error ?? "Failed to update caption");
      return;
    }
    setEditingId(null);
    await loadItems();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleUpload} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-body">
          Photo or video
          <input type="file" accept="image/*,video/*" required onChange={handleFileChange} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-body">
          Caption
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
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
          disabled={submitting || !file}
          className="bg-brand-green px-6 py-3 text-sm font-body font-medium text-ink-inverse disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Upload"}
        </button>
      </form>

      {status === "loading" && <p>Loading gallery...</p>}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
            <div className="flex flex-1 items-center gap-3">
              <span className="text-sm text-ink/60">{item.media_type}</span>
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editingCaption}
                  onChange={(event) => setEditingCaption(event.target.value)}
                  className="flex-1 border border-ink/20 px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-body">{item.caption || "(no caption)"}</p>
              )}
            </div>
            <div className="flex gap-3">
              {editingId === item.id ? (
                <button type="button" onClick={() => saveCaption(item.id)} className="text-sm underline">
                  Save
                </button>
              ) : (
                <button type="button" onClick={() => startEditing(item)} className="text-sm underline">
                  Edit caption
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-sm text-brand-red underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/admin/GalleryManager.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add components/admin/GalleryManager.tsx components/admin/GalleryManager.test.tsx
git commit -m "feat: add gallery upload/caption-edit/delete manager component"
```

---

### Task 8: Admin gallery page and nav link

**Files:**
- Create: `app/admin/(protected)/gallery/page.tsx`
- Create: `app/admin/(protected)/gallery/page.test.tsx`
- Modify: `app/admin/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `GalleryManager` from `components/admin/GalleryManager.tsx` (Task 7).
- Produces: `/admin/gallery`, and a "Gallery" nav link in the protected layout's header.

- [ ] **Step 1: Write the failing test**

`app/admin/(protected)/gallery/page.test.tsx`:
```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/admin/GalleryManager", () => ({
  GalleryManager: () => <div data-testid="gallery-manager" />,
}));

import AdminGalleryPage from "./page";

test("renders a heading and the GalleryManager component", () => {
  render(<AdminGalleryPage />);
  expect(screen.getByText("Gallery")).toBeInTheDocument();
  expect(screen.getByTestId("gallery-manager")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/admin/(protected)/gallery/page.test.tsx"`
Expected: FAIL, "Cannot find module './page'"

- [ ] **Step 3: Implement**

`app/admin/(protected)/gallery/page.tsx`:
```tsx
import { GalleryManager } from "@/components/admin/GalleryManager";

export default function AdminGalleryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
      <GalleryManager />
    </div>
  );
}
```

In `app/admin/(protected)/layout.tsx`, add a "Gallery" link between "Admins" and the sign-out button:
```diff
         <nav className="flex items-center gap-6 text-sm font-body">
           <Link href="/admin">Dashboard</Link>
           <Link href="/admin/admins">Admins</Link>
+          <Link href="/admin/gallery">Gallery</Link>
           <SignOutButton />
         </nav>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/admin/(protected)/gallery/page.test.tsx"`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/gallery" "app/admin/(protected)/layout.tsx"
git commit -m "feat: add admin gallery page and nav link"
```

---

### Task 9: Public gallery wiring

**Files:**
- Modify: `content/gallery.ts`
- Create: `content/gallery.test.ts`

**Interfaces:**
- Consumes: `createClient` (server) from `lib/supabase/server.ts`; `buildPosterUrl` from `lib/cloudinary.ts` (Task 1).
- Produces: `getGalleryItems(): Promise<GalleryItem[]>` now reads real data. Consumed by the already-existing `/gallery` page (`app/(site)/gallery/page.tsx`), unchanged by this task.

- [ ] **Step 1: Write the failing test**

`content/gallery.test.ts`:
```ts
import { beforeEach, expect, test, vi } from "vitest";

const orderMock = vi.fn();
const selectMock = vi.fn(() => ({ order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: fromMock }),
}));

vi.mock("@/lib/cloudinary", () => ({
  buildPosterUrl: (publicId: string) =>
    `https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/${publicId}.jpg`,
}));

import { getGalleryItems } from "./gallery";

beforeEach(() => {
  orderMock.mockReset();
  selectMock.mockClear();
  fromMock.mockClear();
});

test("returns an empty array on a query error", async () => {
  orderMock.mockResolvedValue({ data: null, error: new Error("db down") });
  await expect(getGalleryItems()).resolves.toEqual([]);
});

test("maps image rows without a posterUrl", async () => {
  orderMock.mockResolvedValue({
    data: [
      {
        id: "1",
        media_type: "image",
        url: "https://x/y.jpg",
        storage_path: "oto-gallery/y",
        caption: "Rally",
        created_at: "2026-01-01",
      },
    ],
    error: null,
  });
  const items = await getGalleryItems();
  expect(items).toEqual([
    { id: "1", type: "image", url: "https://x/y.jpg", posterUrl: undefined, caption: "Rally", createdAt: "2026-01-01" },
  ]);
  expect(fromMock).toHaveBeenCalledWith("oto_gallery");
});

test("maps video rows with a derived posterUrl", async () => {
  orderMock.mockResolvedValue({
    data: [
      {
        id: "2",
        media_type: "video",
        url: "https://x/v.mp4",
        storage_path: "oto-gallery/v",
        caption: "Launch",
        created_at: "2026-01-02",
      },
    ],
    error: null,
  });
  const items = await getGalleryItems();
  expect(items[0].posterUrl).toBe(
    "https://res.cloudinary.com/test-cloud/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/oto-gallery/v.jpg"
  );
  expect(items[0].type).toBe("video");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run content/gallery.test.ts`
Expected: FAIL — test file imports work, but assertions fail since `getGalleryItems()` still returns `[]` unconditionally.

- [ ] **Step 3: Implement**

`content/gallery.ts`:
```ts
import { createClient } from "@/lib/supabase/server";
import { buildPosterUrl } from "@/lib/cloudinary";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string;
  caption: string;
  createdAt: string;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("oto_gallery")
    .select("id, media_type, url, storage_path, caption, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    type: row.media_type as "image" | "video",
    url: row.url,
    posterUrl: row.media_type === "video" ? buildPosterUrl(row.storage_path) : undefined,
    caption: row.caption,
    createdAt: row.created_at,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run content/gallery.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add content/gallery.ts content/gallery.test.ts
git commit -m "feat: read real gallery content from oto_gallery"
```

---

### Task 10: Migration script

**Files:**
- Create: `scripts/migrate-gallery-to-cloudinary.mjs`

**Interfaces:** None (standalone script, run by hand in Task 11).

- [ ] **Step 1: Write the script**

`scripts/migrate-gallery-to-cloudinary.mjs`:
```js
import { readdir, unlink } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GALLERY_DIR = path.resolve(process.cwd(), "public/gallery");
const FOLDER = "oto-gallery";

function slugify(filename) {
  const base = path.parse(filename).name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isVideo(filename) {
  return path.extname(filename).toLowerCase() === ".mp4";
}

async function uploadFile(filePath, publicId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, public_id: publicId, resource_type: resourceType, overwrite: false },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    createReadStream(filePath).pipe(stream);
  });
}

async function main() {
  const files = await readdir(GALLERY_DIR);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of files) {
    const filePath = path.join(GALLERY_DIR, filename);
    const video = isVideo(filename);
    const publicId = slugify(filename);
    const storagePath = `${FOLDER}/${publicId}`;

    const { data: existing, error: existingError } = await supabase
      .from("oto_gallery")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existingError) {
      console.error(`Skipping ${filename}: failed to check for an existing row:`, existingError.message);
      failed++;
      continue;
    }

    if (existing) {
      console.log(`Skipping ${filename}: already migrated (${storagePath})`);
      skipped++;
      continue;
    }

    try {
      const result = await uploadFile(filePath, publicId, video ? "video" : "image");

      const { error: insertError } = await supabase.from("oto_gallery").insert({
        media_type: video ? "video" : "image",
        url: result.secure_url,
        duration_seconds: video ? (result.duration ?? null) : null,
        caption: "",
        storage_path: storagePath,
      });

      if (insertError) {
        console.error(`Uploaded ${filename} but failed to insert its row:`, insertError.message);
        failed++;
        continue;
      }

      if (!video) {
        await unlink(filePath);
      }

      uploaded++;
      console.log(
        `Migrated ${filename} -> ${storagePath}${video ? " (local file kept)" : " (local file deleted)"}`
      );
    } catch (error) {
      console.error(`Failed to migrate ${filename}:`, error.message);
      failed++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, skipped (already migrated): ${skipped}, failed: ${failed}.`);
}

main().catch((error) => {
  console.error("Migration script crashed:", error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Verify the script is syntactically valid**

Run: `node --check scripts/migrate-gallery-to-cloudinary.mjs`
Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-gallery-to-cloudinary.mjs
git commit -m "feat: add gallery migration script"
```

---

### Task 11: Run the migration and verify (controller-executed)

**Files:** None (execution task).

**Interfaces:** None.

This task is executed by the controller directly, not dispatched to a subagent: it needs live Cloudinary/Supabase credentials already present in the local `.env.local`, and it permanently deletes 121 real files from the repository working tree — an irreversible local action that deserves a human-visible checkpoint rather than unattended subagent execution, matching how Task 13 of the admin foundation plan was handled.

- [ ] **Step 1: Confirm environment variables are present**

Check `.env.local` has `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (copy from `/Users/mac/Developer/lanky/atunluto/.env.local`, same pattern already used for the Supabase service-role key, if not already present).

- [ ] **Step 2: Dry-run sanity check**

Before running for real, confirm `public/gallery/` still contains exactly 124 files (121 images, 3 videos) and that `oto_gallery` is currently empty (`mcp__supabase__execute_sql`, `select count(*) from oto_gallery`), so the "skip already migrated" branch is not silently masking a partial prior run.

- [ ] **Step 3: Run the migration script**

Run: `node --env-file=.env.local scripts/migrate-gallery-to-cloudinary.mjs`
Expected: summary line reporting 124 uploaded (or fewer if some legitimately fail — investigate any failures before proceeding), 0 skipped (first run), 0 or a small number failed.

- [ ] **Step 4: Verify against the live database and Cloudinary**

`mcp__supabase__execute_sql`: `select media_type, count(*) from oto_gallery group by media_type` — expect `image: 121, video: 3`.
Confirm `public/gallery/` now contains only the 3 `.mp4` files (images deleted).

- [ ] **Step 5: Verify the public gallery page renders real content**

Start the dev server, request `/gallery`, confirm images render (spot-check a handful of `<img>` `src` values resolve to `res.cloudinary.com` URLs) and that the 3 videos render with a poster frame.

- [ ] **Step 6: Full verification suite**

Run `npm test` (all tests including this plan's additions), `npx tsc --noEmit`, `npm run lint`, and `npm run build` (confirm `/gallery` and `/admin/gallery` both appear in the route listing with the expected `○`/`ƒ` designation).

- [ ] **Step 7: Screenshot for UI sign-off**

Per project convention (`feedback_ui_signoff` memory), capture screenshots of the public `/gallery` page (showing real migrated photos) and `/admin/gallery` (showing the upload form and the item list) and share with the client before considering this plan's UI complete.

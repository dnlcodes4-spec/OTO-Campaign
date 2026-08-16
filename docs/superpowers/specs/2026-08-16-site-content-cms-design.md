# Site Content CMS and Admin Dashboard Refinement

## Purpose

The site foundation spec (`2026-08-04-site-foundation-design.md`) explicitly deferred a CMS: at the time, the client confirmed content was developer-managed. That decision has since changed. The admin foundation spec (`2026-08-14-admin-foundation-design.md`) anticipated this reversal, naming "content management (WordPress-like editing of site text)" as a follow-up built on the admin foundation it shipped.

This spec covers that follow-up: making every piece of copy across nine of the ten `content/*.ts` files editable from `/admin` (`gallery.ts` already has its own dedicated admin surface from the prior spec), by an admin with no code access, with the same immediacy a WordPress editor gives a site owner. It also finishes the admin dashboard refinement that was underway and interrupted mid-build (a toast notification system; loading, error, and pending states on the existing Admins and Gallery managers) — the content editor needs those exact primitives, so building them once as a shared foundation serves both.

Out of scope: a draft/publish distinction (edits go live on save, matching Atunluto's own `site_content` table and the trust model the admin console already uses), and a rich-text/WYSIWYG editor (every text field is plain text or plain paragraphs, matching how the site's copy is written today — no inline bold/links/etc. inside body copy).

## Backend

Same Supabase project as Atunluto and the rest of the OTO admin surface (`jgemycpdcmoebigmgorq`), confirmed live via the Supabase MCP. Atunluto's own `site_content` table is the direct precedent: `key text primary key`, `content jsonb`, `updated_at`, `updated_by`. This spec's table mirrors it exactly, `oto_`-prefixed, touching nothing of Atunluto's own schema or rows.

```sql
create table public.oto_site_content (
  key         text primary key,
  content     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.oto_admins(id) on delete set null
);

alter table public.oto_site_content enable row level security;

create policy "oto_site_content_public_read"
  on public.oto_site_content
  for select
  to anon, authenticated
  using (true);
```

Nine rows, one per content file: `home`, `about`, `story`, `agenda`, `atunluto`, `get-involved`, `senator-job`, `watch`, `site`. (`gallery` content already lives in its own dedicated `oto_gallery` table from the prior spec and is not part of this one.) All writes go through `authorizeAdminRequest`, the same gate every other admin write path already uses — no new permission tier. Any `oto_admin` can edit any content area, matching the flat trust model the admin console already has (any admin can already create/delete other admins and manage the entire gallery).

## Content inventory and shape

Surveyed directly from the current `content/*.ts` files:

| File | Shape | Notes |
|---|---|---|
| `home.ts` | 2 flat fields + 1 image | Simplest file |
| `site.ts` | 2 images + a list of 4 social links (platform/label/href) | `platform` stays a fixed key per entry, not freely editable |
| `watch.ts` | Flat fields + a `video` union (YouTube id or a direct Cloudinary clip) + held-plane copy | The `video` field itself stays developer-managed (it is not simple text, and swapping it is a deliberate one-line release per its own existing design); everything else (`answer`, `body`, `coming.line/detail`) is in scope |
| `senator-job.ts` | Intro + a repeating list of 4 segments (number/title/detail) | One level of repetition |
| `about.ts` | Flat fields, 1 image, 2 lists of strings, a repeating list of education entries, a repeating list of university tie-up pairs | Two independent repeating lists |
| `get-involved.ts` | 1 image, 3 repeating lists (turnout stats, asks, vote targets), flat fields | |
| `atunluto.ts` | Flat fields, a repeating list of stats, two named "programme group" objects (title + entries list) | |
| `story.ts` | A teaser (list of paragraphs + CTA) and a full page (lead, a repeating list of sections each with heading + a list of body paragraphs, a closing group) | Three levels of nesting at its deepest (`page.sections[].body[]`) |
| `agenda.ts` | Intro + a repeating list of items, each with a thesis and *either* a flat `points` list *or* a repeating `routes` list (each route itself has its own `points` list), plus an optional `note` | The deepest and only conditionally-shaped file: some items use `points`, others use `routes`, not both |

This range is exactly why a single recursive form renderer is worth building rather than ten bespoke pages: the same primitives (text, paragraph list, repeating group) cover everything from `home.ts` to `agenda.ts`, and a field type only needs to be built once.

## Schema system

A recursive field type, one schema per content file (colocated as `content/schemas/<key>.ts`):

```ts
type Field =
  | { type: "text"; label: string }
  | { type: "longtext"; label: string }
  | { type: "image"; label: string }
  | { type: "list"; label: string; item: Field }
  | { type: "group"; label: string; fields: Record<string, Field> }
  | { type: "optional"; field: Field }
```

`list` covers both "list of strings" (item: text) and "repeating group" (item: group) with the same primitive — a repeating section is just a list whose item type is a group. `optional` wraps a field that may be entirely absent (Agenda's `points`/`routes`/`note`), rendering as present-or-not with an explicit add/remove control rather than always-present-but-empty.

One generic `SchemaForm` client component walks a schema and a JSON value together, rendering:
- `text` → a single-line input
- `longtext` → a textarea
- `image` → the current image plus a "Replace" control (see Image fields below)
- `list` → each item rendered per its `item` schema, with add/remove/reorder controls
- `group` → each field rendered per its own schema, under a heading
- `optional` → the wrapped field, with a way to add or remove it entirely

`SchemaForm` is a pure, controlled component (`value`, `onChange`) with no data fetching or save logic of its own — the page that renders it owns loading the current content and calling the save API. This keeps it independently testable: feed it a schema and a value, assert it renders the right controls and calls `onChange` with the right shape on edit, with no network mocking needed.

`SchemaForm` only renders and edits keys explicitly declared in a content area's schema; any other key already present in the underlying JSON value passes through unchanged on save. This is how fixed structural data stays stable without a special-cased field type: a social link's `platform` key or an agenda item's `number` key simply isn't declared in that group's schema, so it never renders a control and is never touched, while its sibling fields (`label`/`href`, `title`/`thesis`) remain editable.

## Image fields

Reuses the exact upload pipeline already built for the gallery: sign → direct-to-Cloudinary upload → save the resulting URL, just against a separate `oto-site` Cloudinary folder so site-identity images (portraits, logos) stay distinct from gallery photos. The sign route needs a `folder` parameter (currently hardcoded to `"oto-gallery"` in `lib/cloudinary.ts`'s `signUpload`) rather than being gallery-specific; that becomes a small, backward-compatible signature change (`signUpload(folder: string)` already takes a folder argument, so this is exposing an existing parameter through the API route, not a new capability).

## Site-rendering integration

Every `content/*.ts` file's `export const xContent = {...}` becomes `export async function getXContent()`, which:
1. Fetches its row from `oto_site_content` by key
2. Deep-merges the row's `content` over the current hardcoded object (the hardcoded object becomes the fallback default, not deleted)
3. Returns the merged result; on any fetch error, or if the row doesn't exist yet, returns the hardcoded default untouched

This is the same fallback-safe shape as `getGalleryItems()`: nothing can break the public site, a field neither in the DB row nor ever edited still renders from the code default, and a schema field added later (a new content field a developer adds to a page) works immediately without needing a migration first. The initial seed migration is mechanical: one `insert` per key, each `content` value copied verbatim from that file's current hardcoded export, so day one ships with zero visible change.

Every call site (e.g. `app/(site)/page.tsx` calling `homeContent`) needs its call updated to `await getHomeContent()` — mechanical, not a rewrite, since these are already Server Components in an `async` render tree (matching how `getGalleryItems()` is already awaited in `app/(site)/gallery/page.tsx`).

## Admin UI

- A "Content" link joins Dashboard / Admins / Gallery in the protected admin nav
- `/admin/content` — a list of the nine editable content areas with readable labels ("Home", "About", "Story", "Agenda", ...), each linking to its editor
- `/admin/content/[key]` — loads the current content for that key, renders `SchemaForm`, and a Save button; on save, a toast confirms success or reports failure, and the form keeps the attempted edit on failure rather than losing it

## Dashboard refinement (shared foundation, built first)

Interrupted mid-build previously; this spec's first implementation phase finishes it, since the content editor depends on the same primitives:

- **Toast system**: a `ToastProvider` mounted in the protected admin layout, a `useToast()` hook exposing `success(message)` / `error(message)`, auto-dismissing, stacking, brand-styled (solid `brand-green`/`brand-red` background, `ink-inverse` text, matching the button color conventions already used throughout the admin console)
- **Loading states**: skeleton placeholders (already the pattern used by the public gallery's `loading.tsx`) replace the current bare "Loading admins..." / "Loading gallery..." text
- **Error states**: existing failed-fetch paths route through the toast system instead of (or alongside) the inline `role="alert"` paragraph, for consistency with how save/delete errors will report in the new content editor
- **Pending states**: per-row/per-action pending indicators (e.g. a delete button showing a pending state while its request is in flight) rather than only the top-level form submit button
- **Admins and Gallery list layout**: moves from the current bordered `<ul>` row list to a table, giving column alignment for the info that already exists (email/display name, media type, caption) — no new data, no new columns, purely the layout described as part of the original "refine the dashboard" request

## Testing

Existing conventions throughout: Vitest + Testing Library, `vi.mock` calls before imports, `beforeEach` resets. `SchemaForm` gets the heaviest coverage as the piece every content page depends on: one field type at a time (renders correctly, calls `onChange` correctly), then nested cases (a `list` of `group`s, an `optional` field toggling), using small hand-built schemas in the test file rather than the real (large) Agenda schema, so failures point at the renderer, not at a specific content file's shape. Each content page's own test stays thin: mock the fetch, assert the right schema and value reach `SchemaForm`, assert save posts the right payload.

## Global constraints

- Same constraints as every prior admin spec: `authorizeAdminRequest` for every write, TypeScript strict + ESLint (including the `queueMicrotask` pattern for effects that set state), brand tokens only, no em dashes.
- No content field becomes rich text; everything stays plain strings/paragraphs, matching how the site is written today.
- `watch.ts`'s `video` field is explicitly excluded from the schema-editable surface (see Content inventory) — its own existing swap-in design stays as-is.

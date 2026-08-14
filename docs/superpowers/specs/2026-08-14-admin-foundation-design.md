# OTO for Senate: Admin Foundation Design

Date: 2026-08-14
Status: Approved, ready for implementation planning

## Purpose

This is the "Gated Admin and Upload" follow-up spec anticipated by the site foundation spec (`2026-08-04-site-foundation-design.md`), which deferred authentication, media storage, and the upload pipeline until the site's own conventions existed. This spec covers only the foundation layer: authentication, the admin data model, and the two admin-account-management surfaces. Content management (WordPress-like editing of site text) and gallery/Cloudinary integration are separate follow-up specs building on this one, so each can be reviewed and shipped independently rather than landing as one large change.

## Scope

In scope: Supabase Auth-backed login, session-gated `/admin/*` routes, the `oto_admins` table, an in-dashboard admin management page, and a separately-gated dev-only bootstrap page for creating the first admin(s).

Out of scope, deferred to follow-up specs: site text content management (`oto_site_content` table plus editor UI), and gallery/Cloudinary integration (`oto_gallery` table, Cloudinary upload pipeline, migrating the existing files in `public/gallery`).

## Backend

Same Supabase project as the sibling Atunluto campaign site (project "Atunluto", id `jgemycpdcmoebigmgorq`), confirmed live via the Supabase MCP: it already holds Atunluto's own `admins`, `site_content`, `gallery`, `members`, `election_admins`, and related tables, all with RLS enabled and real production data (thousands of member rows). OTO gets its own dedicated tables, `oto_`-prefixed, so nothing in this or any follow-up spec touches Atunluto's existing schema, policies, or rows.

## Data model

```sql
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

No `role` or `is_active` column: every OTO admin has full access, and removal is a hard delete (drops the `oto_admins` row and the underlying `auth.users` row via the Supabase Admin API), matching "delete" rather than a soft-disable flag. All writes (create/delete) happen through server-side API routes using the service-role key, since creating or deleting an `auth.users` row requires it and cannot be done from the anon/authenticated client roles. The SELECT policy above only guards reads (the admin list view).

## Auth flow

- `@supabase/supabase-js` plus `@supabase/ssr`, cookie-based sessions, same libraries Atunluto uses.
- `middleware.ts` protects every `/admin/*` route except `/admin/login`: a valid Supabase session is required, and the session's user id must also exist in `oto_admins`. A valid Supabase login by itself is not sufficient; membership in `oto_admins` is the real gate.
- No public self-signup. Accounts are only created via the two surfaces below.

## Admin management surfaces

Both surfaces render the same underlying list/create/delete UI and call the same server-side API routes (`/api/admin/admins` for `GET`/`POST`, `/api/admin/admins/[id]` for `DELETE`); they differ only in how they're reached:

- `/admin/admins` - inside the authenticated dashboard, linked from nav, for day-to-day account management once already logged in.
- `/dev/admins` - a separate top-level route, not linked anywhere in the app. Gated by a server-only env flag (`ADMIN_SETUP_ENABLED`) that makes the route return `notFound()` outright when unset, plus a shared secret (`ADMIN_SETUP_KEY`) typed into the page itself. Exists to create the very first admin, for when `oto_admins` is empty and `/admin/login` has nobody to log in as yet.

Creating an admin: the creator sets the new admin's password directly in the form, with a "generate strong password" helper button. No email/invite flow, since OTO has no email delivery configured.

## Pages and routes

- `/admin/login` - public, email plus password.
- `/admin` - authenticated landing shell; stub for now, with nav placeholders for Content and Gallery that activate in later specs.
- `/admin/admins` - list, create, delete.
- `/dev/admins` - gated bootstrap version of the same.
- `middleware.ts` - session and `oto_admins` membership check.

## New dependencies

`@supabase/supabase-js`, `@supabase/ssr`.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - safe to expose client-side, reused from the same Atunluto project (confirmed exact names via Atunluto's own `.env.local` and the Supabase MCP's publishable-keys list).
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, never `NEXT_PUBLIC_`.
- `ADMIN_SETUP_ENABLED`, `ADMIN_SETUP_KEY` - server-only, gate `/dev/admins`.

These get set in `.env.local` for local dev and in Plesk's Node.js "Custom Environment Variables" panel for production. `ADMIN_SETUP_ENABLED` stays unset in production once bootstrapping is done.

## Testing

Vitest plus Testing Library, matching the existing project convention (`Nav.test.tsx`, `Footer.test.tsx`, `lib/site.test.ts`):

- The `oto_admins` membership check helper.
- API route handlers for create/delete (mocked Supabase client, both service-role and anon paths).
- Login form and admin list/create/delete components.

Middleware route-protection is verified by hand against the running dev server, the same approach used for the earlier nav change, since it is a poor fit for a unit test in this stack.

## Follow-up specs

1. **Site content management** - `oto_site_content` table plus editor UI, migrating the site's hardcoded `content/*.ts` copy to a client-editable source.
2. **Gallery and Cloudinary** - `oto_gallery` table, Cloudinary upload/delete pipeline (same pattern as Atunluto's `lib/cloudinary.js` and `api/cloudinary-*` routes), a migration script to move the existing files in `public/gallery/` (130+ images and videos) to Cloudinary and seed the table, and wiring `content/gallery.ts`'s `getGalleryItems()` to read from it instead of returning `[]`.

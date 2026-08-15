# OTO for Senate: Gallery and Cloudinary Design

Date: 2026-08-15
Status: Approved, ready for implementation planning

## Purpose

This is the second of the two follow-up specs anticipated by the site foundation spec (`2026-08-04-site-foundation-design.md`) and named explicitly in the admin foundation spec's "Follow-up specs" section. It wires the public gallery page to real content and gives admins a way to manage it, replacing `content/gallery.ts`'s `getGalleryItems()` (currently hardcoded to return `[]`) with a Cloudinary-backed, database-indexed gallery, plus a migration for the 124 files already sitting in `public/gallery/`.

## Scope

In scope: an `oto_gallery` table, a Cloudinary integration module and signed-upload routes, an admin gallery management page (upload, delete, caption edit), the public `getGalleryItems()` wiring, and a one-time migration script for the existing local files.

Out of scope: the third follow-up spec (site text content management, `oto_site_content`) remains separate and untouched here.

## Backend

Same Supabase project as Atunluto and OTO's own admin foundation (project id `jgemycpdcmoebigmgorq`). New table, `oto_`-prefixed, per the established convention — never touches Atunluto's own `gallery` table.

Cloudinary: the **same Cloudinary account Atunluto uses** (the client's explicit instruction — "the same cloudinary"), confirmed via direct research against Atunluto's own `lib/cloudinary.js`, its three `cloudinary-*` API routes, `hooks/use-gallery.js`, and `scripts/migrate-to-cloudinary.mjs`. OTO's assets live under a new `oto-gallery` folder within that account, keeping them separated from Atunluto's own `gallery` folder without needing a separate account.

## Data model

```sql
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

create policy "oto_gallery_public_read"
  on public.oto_gallery
  for select
  to anon, authenticated
  using (true);
```

`storage_path` holds the Cloudinary `public_id`, needed to target the asset on delete. No stored `poster_url` column: a video's poster frame is a derived Cloudinary URL transform, computed from `storage_path` plus the cloud name at read time (`so_0,w_800,c_fill,q_auto,f_jpg`, the same technique Atunluto's `buildPosterUrl` uses), so there is nothing to keep in sync between two upload steps. All writes go through the service-role key via gated API routes, matching `oto_admins`; the SELECT policy allows public read, since gallery content is public-facing.

This deliberately does **not** replicate Atunluto's dual-image-upload pattern (a separately generated thumbnail plus the full-resolution original, two distinct uploads and two URL columns). OTO uploads one image per photo; the thumbnail view uses a Cloudinary URL transform (`w_400,c_fill,q_auto,f_auto`) against that same asset instead of a second physical upload. This keeps the schema matching the already-shipped `GalleryItem` type (one `url` field) and avoids replicating the client-side image-compression/thumbnail-generation step Atunluto's admin UI runs before upload.

## `GalleryItem` type change

One small, additive extension to the type defined in `content/gallery.ts`:

```ts
export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  posterUrl?: string; // new: video poster frame, derived Cloudinary URL, undefined for images
  caption: string;
  createdAt: string;
};
```

`components/sections/GalleryItemCard.tsx`'s `<video>` element currently has no `poster` attribute at all — it renders a blank frame until playback starts. Wiring `poster={item.posterUrl}` is a real, low-cost fix this integration enables directly, not unrelated scope creep: the poster URL is free (a URL template, no extra request at upload time), and the component already has the exact spot where it belongs.

## Cloudinary integration

`lib/cloudinary.ts` mirrors Atunluto's `lib/cloudinary.js` shape: configures the `cloudinary` v2 SDK from three env vars and exports it, plus a `buildPosterUrl(cloudName, publicId)` URL-template helper (no network call, matching Atunluto's `utils/video-processing.js`).

**Upload flow is direct-to-Cloudinary**, verified as Atunluto's actual working pattern via direct code research: the browser uploads the file bytes straight to `https://api.cloudinary.com/v1_1/{cloudName}/{image|video}/upload` using a short-lived signature minted by a Next.js API route; the file never passes through the Next.js server. Only `{timestamp, folder}` are signed, matching Atunluto exactly.

**Delete is server-proxied**, since destroying a Cloudinary asset requires the API secret, which cannot be handed to the browser the way an upload signature can.

## Routes

- `GET /api/admin/gallery/sign` — signs a new upload (folder `oto-gallery`). Gated by `authorizeAdminRequest` (Task 3, session path only — gallery management is not a bootstrap concern, so the dev-setup-key path does not apply here). Returns `{ signature, timestamp, folder, cloudName, apiKey }`.
- `POST /api/admin/gallery` — after the browser's direct Cloudinary upload succeeds, the client posts `{ url, storagePath, mediaType, durationSeconds?, caption }`; the route inserts the `oto_gallery` row via the service-role client and returns it.
- `GET /api/admin/gallery` — list, for the admin UI.
- `PATCH /api/admin/gallery/[id]` — caption edit only; no other field is mutable after upload.
- `DELETE /api/admin/gallery/[id]` — same ordering already established for `oto_admins` deletion: delete-then-`.select()` the row first to confirm it genuinely existed, only then delete the Cloudinary asset (`cloudinary.uploader.destroy(storagePath, { resource_type })`).

All four routes reuse `authorizeAdminRequest` from `lib/admin/authorize.ts` (already built, already reviewed) rather than reimplementing gating logic.

## Admin UI

`/admin/gallery`, inside the existing `(protected)` route group (Task 10's layout already guards it). A `GalleryManager` component, structurally parallel to `AdminsManager`: an upload form (file picker, auto-detects image vs video from file type, a caption field), and a grid of existing items with inline caption editing and a delete action.

Caption editing is in scope for this spec (the client's explicit choice): the 124 migrated files carry only raw WhatsApp-export filenames with no usable caption text, so without an edit affordance they would stay permanently blank.

## Public wiring

`content/gallery.ts`'s `getGalleryItems()` swaps from returning `[]` to querying `oto_gallery` (ordered by `created_at` descending) via the public, RLS-scoped Supabase client, mapping each row to a `GalleryItem` — including computing `posterUrl` for video rows via `buildPosterUrl`.

## Migration script

A one-time Node script (`scripts/migrate-gallery-to-cloudinary.mjs`, run via `node --env-file=.env.local`), covering all 124 files currently in `public/gallery/` (121 images, 3 videos, 41MB total — confirmed by direct inspection). Runs server-side with the API secret already available, so it uploads directly via the `cloudinary` SDK rather than the signed-upload dance the live app uses. For each file: upload to Cloudinary under `oto-gallery`, insert the corresponding `oto_gallery` row via the service-role client, then:

- **Images:** delete the local file once its upload and DB insert are both confirmed.
- **Videos:** still uploaded and inserted into `oto_gallery` now, but the local `.mp4` files are left in place — the client has a separate future task involving them, and this migration should not remove files that task may still need.

Idempotency: the script assigns each file a deterministic Cloudinary `public_id` derived from its original filename (slugified, under the `oto-gallery` folder). Before uploading, it checks whether an `oto_gallery` row with that exact `storage_path` already exists; if so, it skips the file entirely (no re-upload, no duplicate row), making the script safe to re-run after a partial failure.

## Testing

Vitest plus Testing Library, matching the project's established conventions:

- `lib/cloudinary.ts`'s `buildPosterUrl` (pure function, easy to test directly).
- The four API route handlers (mocked Cloudinary SDK and Supabase admin client), including the delete-ordering guarantee (Cloudinary asset is never targeted for deletion if the row-delete found nothing).
- `GalleryManager`'s upload, caption-edit, and delete flows (mocked `fetch`, matching `AdminsManager.test.tsx`'s pattern).
- `getGalleryItems()` against a mocked Supabase client, including the video `posterUrl` derivation.
- `GalleryItemCard`'s existing test file gets one addition: a video item with `posterUrl` renders the `poster` attribute.

The migration script is verified by hand (run once against the real 124 files, confirm the gallery page renders them, confirm image files are gone from `public/gallery/` and the 3 videos remain) rather than by an automated test, matching how Task 13's manual bootstrap verification worked for the admin foundation.

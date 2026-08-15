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

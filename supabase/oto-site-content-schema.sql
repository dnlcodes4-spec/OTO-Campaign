-- ═══════════════════════════════════════════════════════════════════════
-- OTO SITE CONTENT
-- Editable copy for the public OTO site, mirroring Atunluto's own
-- site_content table exactly (key/content/updated_at/updated_by), but
-- oto_-prefixed and never touching Atunluto's rows. Applied via the
-- Supabase MCP `apply_migration` tool.
-- ═══════════════════════════════════════════════════════════════════════

create table public.oto_site_content (
  key         text primary key,
  content     jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.oto_admins(id) on delete set null
);

alter table public.oto_site_content enable row level security;

-- Public website: anyone (including anonymous visitors) may read live content.
create policy "oto_site_content_public_read"
  on public.oto_site_content
  for select
  to anon, authenticated
  using (true);

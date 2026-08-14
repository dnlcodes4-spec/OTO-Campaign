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

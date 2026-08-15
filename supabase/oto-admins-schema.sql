-- ═══════════════════════════════════════════════════════════════════════
-- OTO ADMINS
-- Dedicated to the OTO campaign site; lives in the same Supabase project as
-- Atunluto but never reads or writes Atunluto's own admins/site_content/
-- gallery tables. Applied via the Supabase MCP `apply_migration` tool.
--
-- Revision note: the original SELECT policy compared auth.uid() against
-- oto_admins from inside a policy ON oto_admins, which is self-recursive
-- and errors at evaluation time ("infinite recursion detected in policy
-- for relation oto_admins"). Replaced with a SECURITY DEFINER helper,
-- which evaluates with elevated privileges and so bypasses RLS internally,
-- breaking the recursion while preserving "any oto_admin can see the full
-- list" semantics. Also switched created_by's foreign key to ON DELETE SET
-- NULL, since NO ACTION (the implicit default) blocked deleting any admin
-- who had ever created another admin.
-- ═══════════════════════════════════════════════════════════════════════

create table public.oto_admins (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.oto_admins(id) on delete set null
);

alter table public.oto_admins enable row level security;

-- SECURITY DEFINER so the membership check does not re-trigger the policy
-- it backs. Not directly callable by clients: EXECUTE is revoked from
-- public/anon/authenticated below, leaving it usable only by the policy
-- evaluator (which runs as the function owner).
create or replace function public.is_oto_admin(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.oto_admins where id = check_user_id);
$$;

revoke execute on function public.is_oto_admin(uuid) from public;
revoke execute on function public.is_oto_admin(uuid) from anon;
revoke execute on function public.is_oto_admin(uuid) from authenticated;

create policy "oto_admins_read_if_admin"
  on public.oto_admins
  for select
  to authenticated
  using (public.is_oto_admin(auth.uid()));

-- 0002_rls.sql — helper functions and every permission policy (IMPLEMENTATION_PLAN §9).
-- Helper functions are defined here because the policies below depend on them.

create or replace function public.is_member(p_stokvel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stokvel_members m
    where m.stokvel_id = p_stokvel_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_organizer(p_stokvel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stokvel_members m
    where m.stokvel_id = p_stokvel_id
      and m.user_id = auth.uid()
      and m.role = 'organizer'
      and m.status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_admin from public.profiles p where p.id = auth.uid()
  ), false);
$$;

-- Explicit grants. RLS narrows these; service_role bypasses RLS by design.
revoke all on public.profiles, public.stokvels, public.stokvel_members,
  public.invitations, public.contributions, public.payouts,
  public.disputes, public.audit_log
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

grant select, insert on public.stokvels to authenticated;
grant update, delete on public.stokvels to authenticated;
grant select, insert, update, delete on public.stokvel_members to authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select, insert, update, delete on public.contributions to authenticated;
grant select, insert, update, delete on public.payouts to authenticated;
grant select, insert, update on public.disputes to authenticated;
grant select on public.audit_log to authenticated;

alter table public.profiles enable row level security;
alter table public.stokvels enable row level security;
alter table public.stokvel_members enable row level security;
alter table public.invitations enable row level security;
alter table public.contributions enable row level security;
alter table public.payouts enable row level security;
alter table public.disputes enable row level security;
alter table public.audit_log enable row level security;

-- SEC1 / SEC2 — profiles: read own row; update only own safe columns.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- SEC3 / SEC4 / SEC5 — stokvels.
create policy stokvels_select_member on public.stokvels
  for select to authenticated using (public.is_member(id));
create policy stokvels_insert_own on public.stokvels
  for insert to authenticated with check (created_by = auth.uid());
create policy stokvels_update_organizer on public.stokvels
  for update to authenticated
  using (public.is_organizer(id)) with check (public.is_organizer(id));
create policy stokvels_delete_organizer on public.stokvels
  for delete to authenticated using (public.is_organizer(id));

-- SEC6 / SEC7 / SEC8 — stokvel_members.
create policy members_select_member on public.stokvel_members
  for select to authenticated using (public.is_member(stokvel_id));
create policy members_insert_organizer on public.stokvel_members
  for insert to authenticated with check (public.is_organizer(stokvel_id));
create policy members_update_organizer on public.stokvel_members
  for update to authenticated
  using (public.is_organizer(stokvel_id))
  with check (public.is_organizer(stokvel_id));
create policy members_delete_organizer on public.stokvel_members
  for delete to authenticated using (public.is_organizer(stokvel_id));

-- SEC9 / SEC10 — invitations (the join RPC is security definer).
create policy invitations_select_organizer on public.invitations
  for select to authenticated using (public.is_organizer(stokvel_id));
create policy invitations_insert_organizer on public.invitations
  for insert to authenticated with check (public.is_organizer(stokvel_id));
create policy invitations_update_organizer on public.invitations
  for update to authenticated
  using (public.is_organizer(stokvel_id))
  with check (public.is_organizer(stokvel_id));

-- SEC11 / SEC12 — contributions.
create policy contributions_select_member on public.contributions
  for select to authenticated using (public.is_member(stokvel_id));
create policy contributions_insert_organizer on public.contributions
  for insert to authenticated with check (public.is_organizer(stokvel_id));
create policy contributions_update_organizer on public.contributions
  for update to authenticated
  using (public.is_organizer(stokvel_id))
  with check (public.is_organizer(stokvel_id));
create policy contributions_delete_organizer on public.contributions
  for delete to authenticated using (public.is_organizer(stokvel_id));

-- SEC13 / SEC14 — payouts.
create policy payouts_select_member on public.payouts
  for select to authenticated using (public.is_member(stokvel_id));
create policy payouts_insert_organizer on public.payouts
  for insert to authenticated with check (public.is_organizer(stokvel_id));
create policy payouts_update_organizer on public.payouts
  for update to authenticated
  using (public.is_organizer(stokvel_id))
  with check (public.is_organizer(stokvel_id));
create policy payouts_delete_organizer on public.payouts
  for delete to authenticated using (public.is_organizer(stokvel_id));

-- SEC15 / SEC16 / SEC17 — disputes.
create policy disputes_select_member on public.disputes
  for select to authenticated using (public.is_member(stokvel_id));
create policy disputes_insert_member on public.disputes
  for insert to authenticated
  with check (public.is_member(stokvel_id) and raised_by = auth.uid());
create policy disputes_update_organizer on public.disputes
  for update to authenticated
  using (public.is_organizer(stokvel_id))
  with check (public.is_organizer(stokvel_id));

-- SEC18 — audit_log: read-only for members. No write policy exists by design.
create policy audit_log_select_member on public.audit_log
  for select to authenticated using (public.is_member(stokvel_id));

-- 0009_delete_account.sql — OP5/M4 self-service account deletion (PRD §5/§12).
-- Auth and profile rows are removed; historical attribution is anonymised via
-- ON DELETE SET NULL. Audit rows stay trigger-owned and immutable (0008), and
-- notification/membership user links keep their existing ON DELETE CASCADE.

-- Historical attribution: keep the group and its ledger, but drop the link to
-- the deleted person. Anonymous rows are labelled "Member" by the API.
alter table public.stokvels alter column created_by drop not null;
alter table public.stokvels drop constraint if exists stokvels_created_by_fkey;
alter table public.stokvels add constraint stokvels_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.invitations alter column invited_by drop not null;
alter table public.invitations drop constraint if exists invitations_invited_by_fkey;
alter table public.invitations add constraint invitations_invited_by_fkey
  foreign key (invited_by) references public.profiles (id) on delete set null;

alter table public.contributions alter column member_id drop not null;
alter table public.contributions drop constraint if exists contributions_member_id_fkey;
alter table public.contributions add constraint contributions_member_id_fkey
  foreign key (member_id) references public.stokvel_members (id) on delete set null;

alter table public.contributions alter column recorded_by drop not null;
alter table public.contributions drop constraint if exists contributions_recorded_by_fkey;
alter table public.contributions add constraint contributions_recorded_by_fkey
  foreign key (recorded_by) references public.profiles (id) on delete set null;

alter table public.payouts alter column member_id drop not null;
alter table public.payouts drop constraint if exists payouts_member_id_fkey;
alter table public.payouts add constraint payouts_member_id_fkey
  foreign key (member_id) references public.stokvel_members (id) on delete set null;

alter table public.payouts alter column recorded_by drop not null;
alter table public.payouts drop constraint if exists payouts_recorded_by_fkey;
alter table public.payouts add constraint payouts_recorded_by_fkey
  foreign key (recorded_by) references public.profiles (id) on delete set null;

alter table public.disputes alter column raised_by drop not null;
alter table public.disputes drop constraint if exists disputes_raised_by_fkey;
alter table public.disputes add constraint disputes_raised_by_fkey
  foreign key (raised_by) references public.profiles (id) on delete set null;

alter table public.disputes drop constraint if exists disputes_resolved_by_fkey;
alter table public.disputes add constraint disputes_resolved_by_fkey
  foreign key (resolved_by) references public.profiles (id) on delete set null;

-- 0007's BR1/BR7 guards still apply to every normal member change. Only the
-- transaction-local flag set by delete_account() exempts the caller's own
-- membership from those guards while the account deletion cascade runs.
create or replace function public.check_stokvel_size()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_delete_user uuid := nullif(current_setting('app.delete_account_user', true), '')::uuid;
begin
  if tg_op = 'INSERT' then
    select count(*) into v_count
    from public.stokvel_members m
    where m.stokvel_id = new.stokvel_id and m.status = 'active';
    if v_count >= 200 then
      raise exception 'A stokvel cannot have more than 200 members.';
    end if;
  elsif tg_op = 'DELETE' then
    if v_delete_user is not null and v_delete_user = old.user_id then
      return old; -- account deletion removes the caller's own membership
    end if;
    if not exists (
      select 1 from public.stokvels s where s.id = old.stokvel_id
    ) then
      return old; -- cascade from deleting the parent stokvel
    end if;
    select count(*) into v_count
    from public.stokvel_members m
    where m.stokvel_id = old.stokvel_id and m.status = 'active';
    if v_count <= 2 then
      raise exception 'A stokvel must have at least 2 members.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.block_member_remove()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_has_unpaid boolean;
  v_delete_user uuid := nullif(current_setting('app.delete_account_user', true), '')::uuid;
begin
  if tg_op = 'DELETE' then
    if v_delete_user is not null and v_delete_user = old.user_id then
      return old; -- account deletion removes the caller's own membership
    end if;
    if not exists (
      select 1 from public.stokvels s where s.id = old.stokvel_id
    ) then
      return old; -- cascade from deleting the parent stokvel
    end if;
  end if;

  select exists (
    select 1 from public.payouts p
    where p.member_id = old.id
      and p.status = 'scheduled'
      and p.scheduled_date >= current_date
  ) into v_has_unpaid;

  if v_has_unpaid then
    select coalesce(p.full_name, 'This member') into v_name
    from public.profiles p where p.id = old.user_id;
    raise exception 'Cannot remove: % has an unpaid payout. Reassign first.', v_name;
  end if;
  return old;
end;
$$;

-- OP23: SEC1 lets a member read only their own profile, so the organizer's
-- client cannot resolve co-member names from the roster. This organizer-only
-- security-definer lookup exposes names for export without changing SEC1 or
-- any existing read policy.
create or replace function public.export_member_names(p_stokvel_id uuid)
returns table (member_id uuid, full_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_organizer(p_stokvel_id) then
    raise exception 'Only the organizer can do this.';
  end if;
  return query
    select m.id, p.full_name
    from public.stokvel_members m
    join public.profiles p on p.id = m.user_id
    where m.stokvel_id = p_stokvel_id;
end;
$$;

revoke all on function public.export_member_names(uuid) from public;
revoke all on function public.export_member_names(uuid) from anon;
grant execute on function public.export_member_names(uuid) to authenticated;

-- During account deletion the actor's profile is already gone when FK SET
-- NULL updates fire the audit triggers. The deletion is an anonymisation
-- event, not a new group change: existing rows are anonymised by 0008 and no
-- new history rows are added. BR8 immutability and the triggers stay in place.
create or replace function public.write_audit(
  p_stokvel_id uuid,
  p_actor uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before jsonb,
  p_after jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := p_actor;
begin
  -- The delete_account() window only anonymises rows; adding audit entries
  -- here would rewrite history that the test contract requires unchanged.
  if nullif(current_setting('app.delete_account_user', true), '') is not null then
    return;
  end if;
  if v_actor is null then
    v_actor := nullif(current_setting('app.audit_actor', true), '')::uuid;
  end if;
  if v_actor is null then
    select s.created_by into v_actor from public.stokvels s where s.id = p_stokvel_id;
  end if;
  if v_actor is null then
    return;
  end if;

  insert into public.audit_log
    (stokvel_id, actor_id, action, entity_type, entity_id, before, after)
  values
    (p_stokvel_id, v_actor, p_action, p_entity_type, p_entity_id, p_before, p_after);
end;
$$;

-- No argument: auth.uid() alone identifies the account. Trigger-owned audit
-- rows are deliberately retained; FK SET NULL anonymises their actor_id.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Please log in again.';
  end if;

  perform set_config('app.delete_account_user', v_user::text, true);
  delete from auth.users where id = v_user;
  perform set_config('app.delete_account_user', '', true);
exception
  when others then
    perform set_config('app.delete_account_user', '', true);
    raise;
end;
$$;

revoke all on function public.delete_account() from public;
revoke all on function public.delete_account() from anon;
grant execute on function public.delete_account() to authenticated;

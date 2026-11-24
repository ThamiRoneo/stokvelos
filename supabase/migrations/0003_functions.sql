-- 0003_functions.sql — join RPC and database guards (IMPLEMENTATION_PLAN §8.5).

-- BR1: 2–200 members. Enforced on insert (max) and on delete (min).
create or replace function public.check_stokvel_size()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if tg_op = 'INSERT' then
    select count(*) into v_count
    from public.stokvel_members m
    where m.stokvel_id = new.stokvel_id and m.status = 'active';
    if v_count >= 200 then
      raise exception 'A stokvel cannot have more than 200 members.';
    end if;
  elsif tg_op = 'DELETE' then
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

-- BR4: contribution amount guard (mirrors the CHECK constraint for a clear message).
create or replace function public.check_contribution_amount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.amount is null or new.amount <= 0 or new.amount > 1000000 then
    raise exception 'Amount must be between R0.01 and R1,000,000.';
  end if;
  return new;
end;
$$;

-- BR5: payout amount guard.
create or replace function public.check_payout_amount()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.amount is null or new.amount <= 0 or new.amount > 10000000 then
    raise exception 'Payout amount must be between R0.01 and R10,000,000.';
  end if;
  return new;
end;
$$;

-- BR7: block removal when the member has an unpaid payout in the current cycle.
create or replace function public.block_member_remove()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_has_unpaid boolean;
begin
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

-- SEC19 / OP11: join via invite token. Validates BR1 and BR6 in one place.
create or replace function public.join_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invitations%rowtype;
  v_user uuid := auth.uid();
  v_count integer;
  v_member_id uuid;
begin
  if v_user is null then
    raise exception 'Please log in again.';
  end if;

  select * into v_invite from public.invitations i where i.token = p_token;
  if not found then
    raise exception 'Couldn''t join. Try again.';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'This invite has expired. Ask the organizer for a new link.';
  end if;

  if v_invite.accepted_at is not null and not v_invite.reusable then
    raise exception 'This invite has already been used.';
  end if;

  select count(*) into v_count
  from public.stokvel_members m
  where m.stokvel_id = v_invite.stokvel_id and m.status = 'active';
  if v_count >= 200 then
    raise exception 'A stokvel cannot have more than 200 members.';
  end if;

  insert into public.stokvel_members (stokvel_id, user_id, role, status)
  values (v_invite.stokvel_id, v_user, 'member', 'active')
  on conflict (stokvel_id, user_id) do update set status = 'active'
  returning id into v_member_id;

  if not v_invite.reusable then
    update public.invitations i
    set accepted_at = now()
    where i.id = v_invite.id and i.accepted_at is null;
  end if;

  return v_invite.stokvel_id;
end;
$$;

revoke all on function public.join_invite(uuid) from public, anon;
grant execute on function public.join_invite(uuid) to authenticated;

-- S6 preview: a logged-in invitee may see only safe group summary fields.
-- Invitation rows stay organizer-only (SEC9); this RPC never exposes members.
create or replace function public.preview_invite(p_token uuid)
returns table (
  stokvel_id uuid,
  name text,
  description text,
  contribution_amount numeric(12,2),
  contribution_frequency text,
  member_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Please log in again.';
  end if;

  select * into v_invite from public.invitations i where i.token = p_token;
  if not found then
    raise exception 'Couldn''t join. Try again.';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'This invite has expired. Ask the organizer for a new link.';
  end if;
  if v_invite.accepted_at is not null and not v_invite.reusable then
    raise exception 'This invite has already been used.';
  end if;

  return query
  select s.id, s.name, s.description, s.contribution_amount, s.contribution_frequency,
         (select count(*) from public.stokvel_members m
          where m.stokvel_id = s.id and m.status = 'active')
  from public.stokvels s
  where s.id = v_invite.stokvel_id;
end;
$$;

revoke all on function public.preview_invite(uuid) from public, anon;
grant execute on function public.preview_invite(uuid) to authenticated;

-- SEC21: admin-only aggregate statistics. No member-level financial data.
create or replace function public.admin_stats()
returns table (total_stokvels bigint, total_members bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only the organizer can do this.';
  end if;
  return query
  select
    (select count(*) from public.stokvels),
    (select count(*) from public.stokvel_members);
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

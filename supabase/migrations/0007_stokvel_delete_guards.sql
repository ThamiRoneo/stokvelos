-- 0007_stokvel_delete_guards.sql — let a deleted stokvel cascade its roster.
-- BR1/BR7 guard member changes in a live group, but ON DELETE CASCADE removes
-- every member row after the parent stokvel row is already gone. Both guards
-- must skip their checks in that case or OP9 (delete group) always fails.

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
begin
  if not exists (
    select 1 from public.stokvels s where s.id = old.stokvel_id
  ) then
    return old; -- cascade from deleting the parent stokvel
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

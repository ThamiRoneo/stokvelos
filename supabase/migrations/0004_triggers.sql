-- 0004_triggers.sql — profile creation, guards and immutable audit history (§8.5).

-- Creates the public profile for every new Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard triggers.
drop trigger if exists trg_check_stokvel_size_insert on public.stokvel_members;
create trigger trg_check_stokvel_size_insert
  before insert on public.stokvel_members
  for each row execute function public.check_stokvel_size();

drop trigger if exists trg_check_stokvel_size_delete on public.stokvel_members;
create trigger trg_check_stokvel_size_delete
  before delete on public.stokvel_members
  for each row execute function public.check_stokvel_size();

drop trigger if exists trg_block_member_remove on public.stokvel_members;
create trigger trg_block_member_remove
  before delete on public.stokvel_members
  for each row execute function public.block_member_remove();

drop trigger if exists trg_check_contribution_amount on public.contributions;
create trigger trg_check_contribution_amount
  before insert or update on public.contributions
  for each row execute function public.check_contribution_amount();

drop trigger if exists trg_check_payout_amount on public.payouts;
create trigger trg_check_payout_amount
  before insert or update on public.payouts
  for each row execute function public.check_payout_amount();

-- SEC4: the creator automatically becomes the group's organizer (BR2).
create or replace function public.add_creator_as_organizer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.stokvel_members (stokvel_id, user_id, role, status)
  values (new.id, new.created_by, 'organizer', 'active')
  on conflict (stokvel_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_add_creator_as_organizer on public.stokvels;
create trigger trg_add_creator_as_organizer
  after insert on public.stokvels
  for each row execute function public.add_creator_as_organizer();

-- Updated-at maintenance.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_stokvel_updated_at on public.stokvels;
create trigger trg_touch_stokvel_updated_at
  before update on public.stokvels
  for each row execute function public.touch_updated_at();

-- BR8 / BR9: audit rows are written here only, never by app code.
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

create or replace function public.audit_on_stokvel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    coalesce(new.id, old.id),
    coalesce(new.created_by, old.created_by),
    'Stokvel updated', 'stokvel',
    coalesce(new.id, old.id),
    to_jsonb(old), to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_stokvel on public.stokvels;
create trigger trg_audit_stokvel
  after insert or update on public.stokvels
  for each row execute function public.audit_on_stokvel();

create or replace function public.audit_on_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    coalesce(new.stokvel_id, old.stokvel_id),
    null,
    case tg_op when 'DELETE' then 'Member removed' else 'Member added' end,
    'stokvel_member',
    coalesce(new.id, old.id),
    to_jsonb(old), to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_member on public.stokvel_members;
create trigger trg_audit_member
  after insert or update or delete on public.stokvel_members
  for each row execute function public.audit_on_member();

create or replace function public.audit_on_contribution()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    coalesce(new.stokvel_id, old.stokvel_id),
    coalesce(new.recorded_by, old.recorded_by),
    case tg_op
      when 'INSERT' then 'Contribution recorded'
      when 'DELETE' then 'Contribution deleted'
      else 'Contribution updated'
    end,
    'contribution',
    coalesce(new.id, old.id),
    to_jsonb(old), to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_contribution on public.contributions;
create trigger trg_audit_contribution
  after insert or update or delete on public.contributions
  for each row execute function public.audit_on_contribution();

create or replace function public.audit_on_payout()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'Payout scheduled';
  elsif tg_op = 'DELETE' then
    v_action := 'Payout cancelled';
  elsif new.status = 'paid' and old.status <> 'paid' then
    v_action := 'Payout marked paid';
  elsif new.status = 'cancelled' and old.status <> 'cancelled' then
    v_action := 'Payout cancelled';
  else
    v_action := 'Payout scheduled';
  end if;

  perform public.write_audit(
    coalesce(new.stokvel_id, old.stokvel_id),
    coalesce(new.recorded_by, old.recorded_by),
    v_action, 'payout',
    coalesce(new.id, old.id),
    to_jsonb(old), to_jsonb(new)
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_payout on public.payouts;
create trigger trg_audit_payout
  after insert or update or delete on public.payouts
  for each row execute function public.audit_on_payout();

create or replace function public.audit_on_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    new.stokvel_id,
    coalesce(new.resolved_by, new.raised_by),
    case when new.status = 'resolved' then 'Dispute resolved' else 'Dispute raised' end,
    'dispute', new.id, to_jsonb(old), to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_dispute on public.disputes;
create trigger trg_audit_dispute
  after update on public.disputes
  for each row
  when (old.status is distinct from new.status)
  execute function public.audit_on_dispute();

-- BR8: no app or direct write may change or remove an audit entry.
create or replace function public.block_audit_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Audit log entries are immutable.';
end;
$$;

drop trigger if exists trg_block_audit_write on public.audit_log;
create trigger trg_block_audit_write
  before update or delete on public.audit_log
  for each row execute function public.block_audit_write();

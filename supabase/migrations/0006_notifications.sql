-- 0006_notifications.sql — in-app notification rows for the five PRD §4.5 triggers.
-- The notification UI is Phase 6 (OP24); the data and triggers are created here.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  message text not null,
  screen text not null check (screen in ('S4', 'S7', 'S9', 'S13')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

create or replace function public.notify(
  p_user uuid, p_stokvel uuid, p_message text, p_screen text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into public.notifications (user_id, stokvel_id, message, screen)
  values (p_user, p_stokvel, p_message, p_screen);
end;
$$;

-- Payout due within 3 days → organizer + recipient member → S9.
create or replace function public.notify_on_payout()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_date text;
  v_message text;
  v_org record;
begin
  if new.scheduled_date < current_date
     or new.scheduled_date > current_date + interval '3 days' then
    return new;
  end if;

  select coalesce(p.full_name, 'A member') into v_name
  from public.profiles p
  join public.stokvel_members m on m.user_id = p.id
  where m.id = new.member_id;
  v_date := to_char(new.scheduled_date, 'YYYY-MM-DD');
  v_message := 'Payout due for ' || v_name || ' on ' || v_date || '.';

  for v_org in
    select m.user_id from public.stokvel_members m
    where m.stokvel_id = new.stokvel_id
      and m.role = 'organizer' and m.status = 'active'
  loop
    perform public.notify(v_org.user_id, new.stokvel_id, v_message, 'S9');
  end loop;

  perform public.notify(
    (select m.user_id from public.stokvel_members m where m.id = new.member_id),
    new.stokvel_id, v_message, 'S9'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_payout on public.payouts;
create trigger trg_notify_payout
  after insert on public.payouts
  for each row execute function public.notify_on_payout();

-- New member joined → organizer → S4 (§18 C10 correction).
create or replace function public.notify_on_member_join()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_stokvel text;
  v_message text;
  v_org record;
begin
  if new.role <> 'member' or tg_op <> 'INSERT' then
    return new;
  end if;
  select coalesce(p.full_name, 'A member') into v_name
  from public.profiles p where p.id = new.user_id;
  select s.name into v_stokvel from public.stokvels s where s.id = new.stokvel_id;
  v_message := v_name || ' joined ' || v_stokvel || '.';
  for v_org in
    select m.user_id from public.stokvel_members m
    where m.stokvel_id = new.stokvel_id
      and m.role = 'organizer' and m.status = 'active'
  loop
    perform public.notify(v_org.user_id, new.stokvel_id, v_message, 'S4');
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_member_join on public.stokvel_members;
create trigger trg_notify_member_join
  after insert on public.stokvel_members
  for each row execute function public.notify_on_member_join();

-- Dispute raised → organizer → S13.
create or replace function public.notify_on_dispute_raised()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stokvel text;
  v_message text;
  v_org record;
begin
  select s.name into v_stokvel from public.stokvels s where s.id = new.stokvel_id;
  v_message := 'New dispute raised in ' || v_stokvel || '.';
  for v_org in
    select m.user_id from public.stokvel_members m
    where m.stokvel_id = new.stokvel_id
      and m.role = 'organizer' and m.status = 'active'
  loop
    perform public.notify(v_org.user_id, new.stokvel_id, v_message, 'S13');
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_dispute_raised on public.disputes;
create trigger trg_notify_dispute_raised
  after insert on public.disputes
  for each row execute function public.notify_on_dispute_raised();

-- Dispute resolved → raising member → S13.
create or replace function public.notify_on_dispute_resolved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stokvel text;
begin
  select s.name into v_stokvel from public.stokvels s where s.id = new.stokvel_id;
  perform public.notify(
    new.raised_by, new.stokvel_id,
    'Your dispute in ' || v_stokvel || ' was resolved.', 'S13'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_dispute_resolved on public.disputes;
create trigger trg_notify_dispute_resolved
  after update on public.disputes
  for each row
  when (old.status is distinct from new.status and new.status = 'resolved')
  execute function public.notify_on_dispute_resolved();

-- Contribution overdue (cycle closed, member unpaid) → organizer + member → S7.
-- Called by a scheduled job in Phase 6; not scheduled here.
create or replace function public.notify_overdue_contributions(p_period text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_name text;
  v_stokvel text;
  v_message text;
  v_org record;
begin
  for v_row in
    select m.id as member_id, m.user_id, m.stokvel_id
    from public.stokvel_members m
    where m.status = 'active'
      and not exists (
        select 1 from public.contributions c
        where c.stokvel_id = m.stokvel_id
          and c.member_id = m.id
          and c.period_label = p_period
      )
  loop
    select coalesce(p.full_name, 'A member') into v_name
    from public.profiles p where p.id = v_row.user_id;
    select s.name into v_stokvel from public.stokvels s where s.id = v_row.stokvel_id;
    v_message := v_name || ' has not contributed for ' || p_period || '.';
    perform public.notify(v_row.user_id, v_row.stokvel_id, v_message, 'S7');
    for v_org in
      select m.user_id from public.stokvel_members m
      where m.stokvel_id = v_row.stokvel_id
        and m.role = 'organizer' and m.status = 'active'
    loop
      perform public.notify(v_org.user_id, v_row.stokvel_id, v_message, 'S7');
    end loop;
  end loop;
end;
$$;

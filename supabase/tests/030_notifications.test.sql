-- T-NOTIF-1 / PRD §4.5: all five notification triggers must write the exact
-- copy and screen. Uses the existing 0006_notifications.sql functions and
-- seed identities only; no new triggers, functions or migrations.
begin;
select plan(7);

-- Deterministic audit actor for the trigger-written rows; all fixtures are
-- rolled back at the end of the file.
set local app.audit_actor = '11111111-1111-1111-1111-111111111111';

-- 1) Payout due within three days → organizer + recipient, exact "Payout due".
insert into public.payouts
  (stokvel_id, member_id, amount, scheduled_date, status, recorded_by)
select 'aaaaaaaa-0000-0000-0000-000000000001', m.id, 250,
       (current_date + 2)::date, 'scheduled',
       '11111111-1111-1111-1111-111111111111'
from public.stokvel_members m
where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  and m.user_id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '22222222-2222-2222-2222-222222222222'
     and screen = 'S9'
     and message = 'Payout due for Sipho Nkosi on '
       || to_char(current_date + 2, 'YYYY-MM-DD') || '.'),
  1::bigint, 'T-NOTIF-1 payout due exact text for the recipient');

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '11111111-1111-1111-1111-111111111111'
     and screen = 'S9'
     and message = 'Payout due for Sipho Nkosi on '
       || to_char(current_date + 2, 'YYYY-MM-DD') || '.'),
  1::bigint, 'T-NOTIF-1 payout due exact text for the organizer');

-- 2) New member joined → organizer, exact join text (§18 C10 corrected to S4).
insert into public.stokvel_members (stokvel_id, user_id, role)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        'e0000000-0000-4000-8000-000000000001', 'member');

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '11111111-1111-1111-1111-111111111111'
     and screen = 'S4'
     and message = 'Platform Admin joined Soweto Savers.'),
  1::bigint, 'T-NOTIF-1 new member joined exact text');

-- 3) Dispute raised → organizer, exact "New dispute raised" text.
insert into public.disputes
  (stokvel_id, raised_by, subject_type, description)
values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'contribution',
   'Notification exact-copy fixture');

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '11111111-1111-1111-1111-111111111111'
     and screen = 'S13'
     and message = 'New dispute raised in Soweto Savers.'),
  1::bigint, 'T-NOTIF-1 dispute raised exact text');

-- 4) Dispute resolved → raising member, exact "Your dispute" text.
update public.disputes
set status = 'resolved',
    resolved_by = '11111111-1111-1111-1111-111111111111',
    resolved_at = now(),
    resolution_note = 'Checked against the ledger.'
where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  and description = 'Notification exact-copy fixture';

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '22222222-2222-2222-2222-222222222222'
     and screen = 'S13'
     and message = 'Your dispute in Soweto Savers was resolved.'),
  1::bigint, 'T-NOTIF-1 dispute resolved exact text');

-- 5) Overdue contribution → member + organizer, exact "has not contributed" text.
select public.notify_overdue_contributions('2026-W52');

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '22222222-2222-2222-2222-222222222222'
     and screen = 'S7'
     and message = 'Sipho Nkosi has not contributed for 2026-W52.'),
  1::bigint, 'T-NOTIF-1 overdue contribution exact text for the member');

select is(
  (select count(*) from public.notifications
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '11111111-1111-1111-1111-111111111111'
     and screen = 'S7'
     and message = 'Sipho Nkosi has not contributed for 2026-W52.'),
  1::bigint, 'T-NOTIF-1 overdue contribution exact text for the organizer');

select * from finish();
rollback;

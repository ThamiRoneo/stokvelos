-- T-BR7-1: the member-removal guard must block a member with an unpaid
-- payout and raise the exact PRD §6.2 / OP14 copy. Isolated fixtures only.
begin;
select plan(3);

insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   is_sso_user, is_anonymous)
values
  ('f0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'trigger_org@stokvelos.app', 'test-hash', now(),
   '{}'::jsonb, '{"full_name":"Trigger Organizer"}'::jsonb, now(), now(), false, false),
  ('f0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'trigger_member@stokvelos.app', 'test-hash', now(),
   '{}'::jsonb, '{"full_name":"Lindiwe Khumalo"}'::jsonb, now(), now(), false, false),
  ('f0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000'::uuid,
   'authenticated', 'authenticated', 'trigger_second@stokvelos.app', 'test-hash', now(),
   '{}'::jsonb, '{"full_name":"Trigger Second"}'::jsonb, now(), now(), false, false);

insert into public.stokvels
  (id, name, contribution_amount, contribution_frequency, created_by)
values
  ('dddddddd-0000-0000-0000-000000000001', 'Trigger Guard Group', 250, 'weekly',
   'f0000000-0000-4000-8000-000000000001');

-- The stokvel insert trigger already adds the organizer. Three active members
-- in total keep the BR1 floor from masking the BR7 error.
insert into public.stokvel_members (stokvel_id, user_id, role, joined_at)
values
  ('dddddddd-0000-0000-0000-000000000001',
   'f0000000-0000-4000-8000-000000000002', 'member', now() + interval '1 day'),
  ('dddddddd-0000-0000-0000-000000000001',
   'f0000000-0000-4000-8000-000000000003', 'member', now() + interval '2 days');

insert into public.payouts
  (stokvel_id, member_id, amount, scheduled_date, status, recorded_by)
select 'dddddddd-0000-0000-0000-000000000001', m.id, 250,
       (current_date + 5)::date, 'scheduled',
       'f0000000-0000-4000-8000-000000000001'
from public.stokvel_members m
where m.stokvel_id = 'dddddddd-0000-0000-0000-000000000001'
  and m.user_id = 'f0000000-0000-4000-8000-000000000002';

select ok(
  (select count(*) = 1 from public.payouts
   where stokvel_id = 'dddddddd-0000-0000-0000-000000000001'
     and status = 'scheduled'),
  'T-BR7-1 trigger fixtures created'
);

select throws_like(
  $$delete from public.stokvel_members
    where stokvel_id = 'dddddddd-0000-0000-0000-000000000001'
      and user_id = 'f0000000-0000-4000-8000-000000000002'$$,
  'Cannot remove: Lindiwe Khumalo has an unpaid payout. Reassign first.',
  'T-BR7-1 removal blocked with exact PRD copy'
);

select is(
  (select count(*) from public.stokvel_members
   where stokvel_id = 'dddddddd-0000-0000-0000-000000000001'
     and user_id = 'f0000000-0000-4000-8000-000000000002'),
  1::bigint,
  'T-BR7-1 member row survives the blocked removal'
);

select * from finish();
rollback;

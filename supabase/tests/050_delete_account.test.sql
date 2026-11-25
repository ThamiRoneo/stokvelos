-- OP5 / T-M4-1: the self-service delete_account RPC. RED until a migration
-- adds public.delete_account() and makes every reference to a deleted person
-- nullable/anonymised. All fixtures and the RPC call stay in this transaction,
-- so seed data is restored by the final rollback.
begin;
select plan(13);

-- Two disposable identities created here (not seeded users), so the test can
-- prove that a caller cannot delete somebody else just by calling the RPC.
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   confirmation_token, recovery_token, email_change_token_new, email_change,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   is_sso_user, is_anonymous)
values
  ('cccccccc-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'phase6-delete-a@stokvelos.app',
   extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Phase Six Deleter"}'::jsonb, now(), now(), false, false),
  ('cccccccc-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'phase6-delete-b@stokvelos.app',
   extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(), '', '', '', '',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Phase Six Bystander"}'::jsonb, now(), now(), false, false);

-- A new group owned by user A, with three other active members so BR1's
-- minimum-size guard cannot block A's cascading membership removal.
set local app.audit_actor = 'cccccccc-0000-4000-8000-000000000001';

insert into public.stokvels
  (id, name, contribution_amount, contribution_frequency, created_by)
values
  ('bbbbbbbb-0000-0000-0000-000000000060', 'Phase Six Deletion Fixture',
   250, 'weekly', 'cccccccc-0000-4000-8000-000000000001');

-- The trg_add_creator_as_organizer trigger already added A as organizer.
insert into public.stokvel_members (stokvel_id, user_id, role)
values
  ('bbbbbbbb-0000-0000-0000-000000000060',
   'cccccccc-0000-4000-8000-000000000002', 'member'),
  ('bbbbbbbb-0000-0000-0000-000000000060',
   '11111111-1111-1111-1111-111111111111', 'member'),
  ('bbbbbbbb-0000-0000-0000-000000000060',
   '22222222-2222-2222-2222-222222222222', 'member');

insert into public.contributions
  (id, stokvel_id, member_id, amount, period_label, note, recorded_by)
select 'cccccccc-0000-4000-8000-000000000011',
       'bbbbbbbb-0000-0000-0000-000000000060', m.id, 250.50, '2026-W01',
       'pgTAP deletion fixture', 'cccccccc-0000-4000-8000-000000000001'
from public.stokvel_members m
where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'
  and m.user_id = 'cccccccc-0000-4000-8000-000000000001';

insert into public.payouts
  (id, stokvel_id, member_id, amount, scheduled_date, status, recorded_by, note)
select 'cccccccc-0000-4000-8000-000000000012',
       'bbbbbbbb-0000-0000-0000-000000000060', m.id, 3750,
       (current_date + 10)::date, 'scheduled',
       'cccccccc-0000-4000-8000-000000000001', 'pgTAP payout fixture'
from public.stokvel_members m
where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'
  and m.user_id = 'cccccccc-0000-4000-8000-000000000001';

reset app.audit_actor;

-- RLS is genuinely enforced: authenticated role with a JWT subject.
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-4000-8000-000000000001","role":"authenticated"}';

select has_function('public', 'delete_account', array[]::text[],
  'T-DB / OP5 public.delete_account() exists');
select function_privs_are('public', 'delete_account', array[]::text[],
  'authenticated', array['EXECUTE'],
  'T-DB / OP5 authenticated can execute public.delete_account()');

-- A takes no argument, so the only way to target somebody else is impossible.
-- This call proves executability and that B's profile survives it.
select lives_ok($$select public.delete_account()$$,
  'T-M4-1 authenticated caller can invoke delete_account on themselves');

reset role;

select is(
  (select count(*) from public.profiles
   where id = 'cccccccc-0000-4000-8000-000000000002'),
  1::bigint,
  'T-M4-1 caller cannot delete a different user''s profile');

select is(
  (select count(*) from public.profiles
   where id = 'cccccccc-0000-4000-8000-000000000001'),
  0::bigint,
  'T-M4-1 caller''s own profile is removed');

select is(
  (select count(*) from auth.users
   where id = 'cccccccc-0000-4000-8000-000000000001'),
  0::bigint,
  'T-M4-1 caller''s auth user is removed');

select is(
  (select count(*) from public.stokvels
   where id = 'bbbbbbbb-0000-0000-0000-000000000060'),
  1::bigint,
  'T-M4-1 the stokvel survives account deletion');

select is(
  (select created_by from public.stokvels
   where id = 'bbbbbbbb-0000-0000-0000-000000000060'),
  null::uuid,
  'T-M4-1 stokvel.created_by is nulled, not left dangling');

select isnt_empty(
  $$select 1 from public.audit_log
    where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'
      and actor_id is null$$,
  'T-M4-1 audit history retains at least one null-actor row');

select is(
  (select count(*) from public.audit_log
   where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'
     and actor_id is null),
  (select count(*) from public.audit_log
   where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'),
  'T-M4-1 audit history remains with a null actor_id');

select is(
  (select count(*) from public.audit_log
   where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000060'
     and actor_id is not null),
  0::bigint,
  'T-M4-1 no audit row still points at the deleted actor');

select is(
  (select count(*) from public.contributions
   where id = 'cccccccc-0000-4000-8000-000000000011'
     and member_id is null and recorded_by is null),
  1::bigint,
  'T-M4-1 contribution survives with member and recorder references nulled');

select is(
  (select count(*) from public.payouts
   where id = 'cccccccc-0000-4000-8000-000000000012'
     and member_id is null and recorded_by is null),
  1::bigint,
  'T-M4-1 payout survives with member and recorder references nulled');

select * from finish();
rollback;

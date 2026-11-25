-- T-SEC-1–10, SEC18, SEC21 and T-DB-6. Every assertion runs as the
-- `authenticated` role with a JWT subject, so RLS is genuinely enforced
-- (the postgres role would bypass it).
begin;
select plan(33);

-- NOMSA organizer of Savers + Uplift; SIPHO member of Savers and organizer
-- of Tembisa; THANDI a plain member of Savers only; ADMIN a Platform Admin.
-- All five accounts come from supabase/migrations/0005_seed.sql.
update public.profiles p
set is_admin = true
where p.id = 'e0000000-0000-4000-8000-000000000001';

set local role authenticated;

-- SEC1 — profiles: read own row only.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(
  (select count(*) from public.profiles
   where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint, 'T-SEC-1a owner can read own profile');

select is(
  (select count(*) from public.profiles
   where id = '22222222-2222-2222-2222-222222222222'),
  0::bigint, 'T-SEC-1b deny reading another user''s profile');

-- SEC2 — profiles: update own safe columns only.
select lives_ok(
  $$update public.profiles set full_name = 'Nomsa Updated'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  'T-SEC-2a owner can update own full_name');

select throws_like(
  $$update public.profiles set is_admin = true
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '%permission denied%',
  'T-SEC-2b a user cannot self-set is_admin');

-- SEC3 — stokvels: read only groups you belong to.
select is(
  (select count(*) from public.stokvels
   where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1::bigint, 'T-SEC-3a member can read own stokvel');

set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from public.stokvels
   where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0::bigint, 'T-SEC-3b deny reading a stokvel you are not in');

-- SEC4 — stokvels: any logged-in user may create one, and becomes organizer.
select lives_ok(
  $$insert into public.stokvels
      (id, name, contribution_amount, contribution_frequency, created_by)
    values
      ('bbbbbbbb-0000-0000-0000-000000000009', 'New Group', 250, 'weekly',
       'd0000000-0000-4000-8000-000000000001')$$,
  'T-SEC-4a logged-in user can create a stokvel');

select is(
  (select count(*) from public.stokvel_members
   where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000009'
     and user_id = 'd0000000-0000-4000-8000-000000000001'
     and role = 'organizer'),
  1::bigint, 'T-SEC-4a creator automatically becomes organizer');

select throws_like(
  $$insert into public.stokvels
      (id, name, contribution_amount, contribution_frequency, created_by)
    values
      ('bbbbbbbb-0000-0000-0000-000000000010', 'Hacked Group', 250, 'weekly',
       '11111111-1111-1111-1111-111111111111')$$,
  '%row-level security%',
  'T-SEC-4b cannot create a stokvel owned by another user');

-- SEC5 — stokvels: update/delete organizer only.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$update public.stokvels set name = 'Soweto Savers Updated'
    where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  'T-SEC-5a organizer can update stokvel');

set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
with affected as (
   update public.stokvels set name = 'hacked'
   where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning id
)
select is(
  (select count(*) from affected),
  0::bigint, 'T-SEC-5b deny non-organizer updating stokvel');

-- SEC6 — stokvel_members: read only own group's roster.
select is(
  (select count(*) from public.stokvel_members
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  4::bigint, 'T-SEC-6a member can read own group roster');

select is(
  (select count(*) from public.stokvel_members
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  0::bigint, 'T-SEC-6b deny reading another group roster');

-- SEC7 — stokvel_members: insert organizer only.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$insert into public.stokvel_members (stokvel_id, user_id, role)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            'e0000000-0000-4000-8000-000000000001', 'member')$$,
  'T-SEC-7a organizer can add a member');

set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_like(
  $$insert into public.stokvel_members (stokvel_id, user_id, role)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            'e0000000-0000-4000-8000-000000000001', 'member')$$,
  '%row-level security%',
  'T-SEC-7b deny non-organizer adding a member');

-- SEC10 — invitations: insert organizer only (created first for SEC9 reads).
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$insert into public.invitations (stokvel_id, invited_by)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            '11111111-1111-1111-1111-111111111111')$$,
  'T-SEC-10a organizer can create an invite');

-- SEC9 — invitations: read organizer only.
select is(
  (select count(*) from public.invitations
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1::bigint, 'T-SEC-9a organizer can read invites');

set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from public.invitations
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0::bigint, 'T-SEC-9b deny member reading invites');

select throws_like(
  $$insert into public.invitations (stokvel_id, invited_by)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            'd0000000-0000-4000-8000-000000000001')$$,
  '%row-level security%',
  'T-SEC-10b deny member creating an invite');

-- SEC8 — stokvel_members: delete organizer only.
with affected as (
   delete from public.stokvel_members
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and user_id = '22222222-2222-2222-2222-222222222222' returning id
)
select is(
  (select count(*) from affected),
  0::bigint, 'T-SEC-8b deny non-organizer removing a member');

-- SEC18 — audit_log: read-only for members, no write policy at all.
select throws_like(
  $$update public.audit_log set action = 'tampered'
    where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '%permission denied%',
  'T-SEC-18b deny any client write to audit_log');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$delete from public.stokvel_members
    where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and user_id = 'd0000000-0000-4000-8000-000000000001'$$,
  'T-SEC-8a organizer can remove a member');

-- SEC11 — contributions: a member reads their own group's ledger.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (select count(*) > 0 from public.contributions
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'T-SEC-11a member can read own group contributions');

-- Thandi was removed from Savers by SEC8a above, so her RLS view is empty.
set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from public.contributions
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0::bigint, 'T-SEC-11b non-member cannot read group contributions');

-- SEC12 — contributions: only the organizer may record one.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$insert into public.contributions
    (stokvel_id, member_id, amount, period_label, recorded_by)
    select 'aaaaaaaa-0000-0000-0000-000000000002', m.id, 250, '2026-W50',
           '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000002'
      and m.user_id = 'd0000000-0000-4000-8000-000000000002'$$,
  'T-SEC-12a organizer can record a contribution');

set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_like(
  $$insert into public.contributions
    (stokvel_id, member_id, amount, period_label, recorded_by)
    select 'aaaaaaaa-0000-0000-0000-000000000002', m.id, 100, '2026-W51',
           'd0000000-0000-4000-8000-000000000002'
    from public.stokvel_members m
    where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000002'
      and m.user_id = 'd0000000-0000-4000-8000-000000000002'$$,
  '%row-level security%',
  'T-SEC-12b member cannot record a contribution');

-- SEC13 — payouts: readable by members of the stokvel only.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (select count(*) > 0 from public.payouts
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'T-SEC-13a stokvel member can read payouts'
);

-- Thandi was removed from Savers by SEC8a above, so she is now an outsider.
set local request.jwt.claims = '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from public.payouts
   where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0::bigint, 'T-SEC-13b outsider cannot read payouts'
);

-- SEC14 — payouts: organizer writes, plain member cannot.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'aaaaaaaa-0000-0000-0000-000000000001', m.id, 250,
           (current_date + 5)::date, '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  'T-SEC-14a organizer can schedule a payout'
);

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_like(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'aaaaaaaa-0000-0000-0000-000000000001', m.id, 250,
           (current_date + 6)::date, '22222222-2222-2222-2222-222222222222'
    from public.stokvel_members m
    where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%row-level security%',
  'T-SEC-14b plain member cannot write a payout'
);

-- SEC21 — Platform Admin: aggregate stats only.
set local request.jwt.claims = '{"sub":"e0000000-0000-4000-8000-000000000001","role":"authenticated"}';
select ok(
  (select total_stokvels >= 4::bigint from public.admin_stats()),
  'T-SEC-21a admin can read aggregate stats');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_like(
  $$select * from public.admin_stats()$$,
  '%Only the organizer can do this.%',
  'T-SEC-21b non-admin denied aggregate stats');

-- T-DB-6 — RLS enabled on every public table.
reset role;
select is(
  (select count(*) from pg_class
   where relnamespace = 'public'::regnamespace
     and relkind = 'r'
     and not relrowsecurity),
  0::bigint, 'T-DB-6 every public table has RLS enabled');

select * from finish();
rollback;

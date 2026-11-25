-- T-BR1-1, T-BR4-1, T-BR5-1, T-BR6-1, T-BR7-1, T-BR8-1, T-BR9-1..3.
begin;
select plan(18);

-- Isolated users for rule tests. Password hash is a literal: Auth is never used here.
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   is_sso_user, is_anonymous)
select
  extensions.gen_random_uuid(), '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  'rule_' || i || '@stokvelos.app', 'test-hash', now(),
  '{}'::jsonb, jsonb_build_object('full_name', 'Rule User ' || i),
  now(), now(), false, false
from generate_series(1, 201) i;

insert into public.stokvels
  (id, name, contribution_amount, contribution_frequency, created_by)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Rule Max', 250, 'weekly',
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Rule Min', 250, 'weekly',
   '11111111-1111-1111-1111-111111111111');

insert into public.stokvel_members (stokvel_id, user_id, role)
values
  ('bbbbbbbb-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222', 'member')
on conflict (stokvel_id, user_id) do nothing;

insert into public.stokvel_members (stokvel_id, user_id)
select 'bbbbbbbb-0000-0000-0000-000000000001', p.id
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'rule_%@stokvelos.app'
limit 199;

select lives_ok(
  $$select 1$$,
  'T-BR1-1 test fixtures created'
);

-- BR1: 200-member ceiling. 200 rows already exist, so the next insert must fail.
select throws_like(
  $$insert into public.stokvel_members (stokvel_id, user_id)
    select 'bbbbbbbb-0000-0000-0000-000000000001', p.id
    from public.profiles p join auth.users u on u.id = p.id
    where u.email like 'rule_%@stokvelos.app'
      and not exists (
        select 1 from public.stokvel_members m
        where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000001'
          and m.user_id = p.id
      )
    limit 1$$,
  '%more than 200 members%',
  'T-BR1-1 a stokvel cannot exceed 200 members'
);

-- BR1: floor of 2 members.
select throws_like(
  $$delete from public.stokvel_members
    where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%at least 2 members%',
  'T-BR1-1 a stokvel cannot drop below 2 members'
);

-- BR4 / BR5: amount guards.
select throws_like(
  $$insert into public.contributions
    (stokvel_id, member_id, amount, period_label, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 0, '2026-W47',
           '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%between R0.01 and R1,000,000%',
  'T-BR4-1 contribution amount must be positive'
);

select throws_like(
  $$insert into public.contributions
    (stokvel_id, member_id, amount, period_label, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 1000000.01, '2026-W49',
           '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%between R0.01 and R1,000,000%',
  'T-BR4-1 contribution amount above R1,000,000 rejected'
);

select throws_like(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 10000001,
           date '2026-12-05', '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%between R0.01 and R10,000,000%',
  'T-BR5-1 payout amount ceiling enforced'
);

select throws_like(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 0,
           date '2026-12-06', '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  'Payout amount must be between R0.01 and R10,000,000.',
  'T-BR5-1 payout amount floor rejected with exact DB copy'
);

select throws_like(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 10000000.01,
           date '2026-12-07', '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  'Payout amount must be between R0.01 and R10,000,000.',
  'T-BR5-1 payout amount above R10,000,000 rejected with exact DB copy'
);

select lives_ok(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 0.01,
           date '2026-12-08', '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  'T-BR5-1 R0.01 is the smallest accepted payout amount'
);

select lives_ok(
  $$insert into public.payouts
    (stokvel_id, member_id, amount, scheduled_date, recorded_by)
    select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 10000000,
           date '2026-12-09', '11111111-1111-1111-1111-111111111111'
    from public.stokvel_members m
    where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
      and m.user_id = '22222222-2222-2222-2222-222222222222'$$,
  'T-BR5-1 R10,000,000 is the largest accepted payout amount'
);

-- BR6: invite expiry, single use and valid join.
insert into public.invitations (stokvel_id, token, invited_by, expires_at, accepted_at, reusable)
values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', now() - interval '1 day', null, false),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111', now() + interval '1 day', now(), false),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111', now() + interval '1 day', null, false),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004',
   '11111111-1111-1111-1111-111111111111', now() + interval '1 day', null, true);

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_like(
  $$select public.join_invite('cccccccc-0000-0000-0000-000000000001'::uuid)$$,
  '%expired%',
  'T-BR6-1 expired invite rejected'
);

select throws_like(
  $$select public.join_invite('cccccccc-0000-0000-0000-000000000002'::uuid)$$,
  '%already been used%',
  'T-BR6-1 used single-use invite rejected'
);

select is(
  (select public.join_invite('cccccccc-0000-0000-0000-000000000003'::uuid)),
  'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
  'T-BR6-1 valid invite returns the stokvel'
);

-- S6 preview never exposes member rows and rejects expired links.
select is(
  (select name from public.preview_invite('cccccccc-0000-0000-0000-000000000004'::uuid)),
  'Rule Min'::text,
  'T-US6-1 invitee can preview safe group summary'
);

select throws_like(
  $$select * from public.preview_invite('cccccccc-0000-0000-0000-000000000001'::uuid)$$,
  '%expired%',
  'T-S6-1 expired invite preview rejected'
);

reset request.jwt.claims;

-- BR7: removal blocked while an unpaid payout exists.
select throws_like(
  $$delete from public.stokvel_members
    where stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and user_id = '22222222-2222-2222-2222-222222222222'$$,
  '%unpaid payout%',
  'T-BR7-1 member with unpaid payout cannot be removed'
);

-- BR8: audit rows cannot be changed.
select throws_like(
  $$update public.audit_log set action = 'tampered' where id in
    (select id from public.audit_log limit 1)$$,
  '%immutable%',
  'T-BR8-1 audit log entries are immutable'
);

-- BR9: a recorded contribution creates exactly one audit row.
insert into public.contributions
  (stokvel_id, member_id, amount, period_label, recorded_by)
select 'bbbbbbbb-0000-0000-0000-000000000002', m.id, 250, '2026-W48',
       '11111111-1111-1111-1111-111111111111'
from public.stokvel_members m
where m.stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
  and m.user_id = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*) from public.audit_log
   where entity_type = 'contribution' and action = 'Contribution recorded'
     and entity_id in (
       select id from public.contributions
       where stokvel_id = 'bbbbbbbb-0000-0000-0000-000000000002'
         and period_label = '2026-W48'
     )),
  1::bigint,
  'T-BR9-1 one audit row per contribution'
);

select * from finish();
rollback;

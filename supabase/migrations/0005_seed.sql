-- 0005_seed.sql — local-only generated test data (IMPLEMENTATION_PLAN §8.7, C3/C14/C16).
-- Five local accounts: one platform admin and four members. No real names,
-- emails or personal data. All emails are @stokvelos.app test identities.
-- This migration is NEVER applied in production. Password matches
-- SEED_TEST_PASSWORD in local .env.local.

do $$
declare
  v_instance uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  -- GoTrue v2.198.0 finds users with instance_id = uuid.Nil. Without an
  -- explicit value these rows are invisible to password login and admin lookups.
  -- The four token columns also need empty strings, not NULL: GoTrue scans them
  -- into Go strings and fails with "converting NULL to string is unsupported".
  insert into auth.users
    (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
     confirmation_token, recovery_token, email_change_token_new, email_change,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     is_sso_user, is_anonymous)
  values
    ('11111111-1111-1111-1111-111111111111', v_instance, 'authenticated', 'authenticated',
     'nomsa@stokvelos.app', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '', '', '', '',
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Nomsa Dlamini"}'::jsonb, now(), now(), false, false),
    ('22222222-2222-2222-2222-222222222222', v_instance, 'authenticated', 'authenticated',
     'sipho@stokvelos.app', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '', '', '', '',
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Sipho Nkosi"}'::jsonb, now(), now(), false, false),
    ('d0000000-0000-4000-8000-000000000001', v_instance, 'authenticated', 'authenticated',
     'thandi@stokvelos.app', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '', '', '', '',
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Thandi Molefe"}'::jsonb, now(), now(), false, false),
    ('d0000000-0000-4000-8000-000000000002', v_instance, 'authenticated', 'authenticated',
     'kabelo@stokvelos.app', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '', '', '', '',
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Kabelo Dube"}'::jsonb, now(), now(), false, false),
    ('e0000000-0000-4000-8000-000000000001', v_instance, 'authenticated', 'authenticated',
     'admin@stokvelos.app', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '', '', '', '',
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Platform Admin"}'::jsonb, now(), now(), false, false)
  on conflict (id) do nothing;

  -- Email identities mirror what GoTrue creates on a real sign-up, so
  -- duplicate detection and admin lookups behave the same for seeded users.
  insert into auth.identities
    (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  select
    extensions.gen_random_uuid(), u.id,
    jsonb_build_object(
      'sub', u.id::text,
      'email', u.email,
      'email_verified', true,
      'full_name', u.raw_user_meta_data ->> 'full_name'
    ),
    'email', u.email, now(), now(), now()
  from auth.users u
  where u.email like '%@stokvelos.app'
  on conflict (provider, provider_id) do nothing;
end $$;

update public.profiles
set is_admin = true
where id = 'e0000000-0000-4000-8000-000000000001';

set local app.audit_actor = '11111111-1111-1111-1111-111111111111';

insert into public.stokvels
  (id, name, description, contribution_amount, contribution_frequency, created_by)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Soweto Savers',
   'Weekly savings group in Soweto.', 250, 'weekly',
   '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Soweto Uplift',
   'Monthly uplift group in Soweto.', 500, 'monthly',
   '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Tembisa Together',
   'Burial stokvel in Tembisa.', 500, 'monthly',
   '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- Three groups, each with at least two members (BR1). Thandi (d000...0001)
-- is deliberately not in Soweto Uplift so the RLS isolation tests hold.
insert into public.stokvel_members (stokvel_id, user_id, role)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'organizer'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'member')
on conflict (stokvel_id, user_id) do nothing;

-- BR11: rotation defaults to join order.
update public.stokvels s
set rotation_order = coalesce((
  select jsonb_agg(m.id order by m.joined_at, m.id)
  from public.stokvel_members m where m.stokvel_id = s.id
), '[]'::jsonb)
where s.id in (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003'
);

-- Functional minimum: one contribution, one scheduled payout, one resolved dispute.
insert into public.contributions
  (stokvel_id, member_id, amount, period_label, note, recorded_by)
select
  'aaaaaaaa-0000-0000-0000-000000000001', m.id, 250, '2026-W47',
  'Weekly contribution', '11111111-1111-1111-1111-111111111111'
from public.stokvel_members m
where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  and m.user_id = '22222222-2222-2222-2222-222222222222'
on conflict (stokvel_id, member_id, period_label) do nothing;

insert into public.payouts
  (stokvel_id, member_id, amount, scheduled_date, status, recorded_by, note)
select
  'aaaaaaaa-0000-0000-0000-000000000001', m.id, 3750,
  date '2026-12-05', 'scheduled', '11111111-1111-1111-1111-111111111111',
  'First rotation payout'
from public.stokvel_members m
where m.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  and m.user_id = '22222222-2222-2222-2222-222222222222';

insert into public.disputes
  (stokvel_id, raised_by, subject_type, subject_id, description,
   status, resolved_by, resolved_at, resolution_note)
select
  d.stokvel_id, d.raised_by, 'contribution', d.subject_id,
  'Please confirm my 2026-W47 contribution.', 'resolved',
  '11111111-1111-1111-1111-111111111111', now(),
  'Confirmed against the group ledger.'
from (
  select c.stokvel_id, m.user_id as raised_by, c.id as subject_id
  from public.contributions c
  join public.stokvel_members m on m.id = c.member_id
  where c.stokvel_id = 'aaaaaaaa-0000-0000-0000-000000000001'
    and c.period_label = '2026-W47'
  limit 1
) d
where not exists (
  select 1 from public.disputes x
  where x.stokvel_id = d.stokvel_id and x.description = 'Please confirm my 2026-W47 contribution.'
);

reset app.audit_actor;

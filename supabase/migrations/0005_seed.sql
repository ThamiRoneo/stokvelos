-- 0005_seed.sql — generated test data only (IMPLEMENTATION_PLAN §8.7, C3/C14/C16).
-- No real names, emails or personal data. Password matches SEED_TEST_PASSWORD in local .env.local.

do $$
declare
  i integer;
  v_email text;
  v_name text;
begin
  -- Named personas.
  insert into auth.users
    (id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     is_sso_user, is_anonymous)
  values
    ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
     'nomsa@example.test', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Nomsa Dlamini"}'::jsonb, now(), now(), false, false),
    ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
     'sipho@example.test', extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Sipho Nkosi"}'::jsonb, now(), now(), false, false)
  on conflict (id) do nothing;

  -- Soweto Savers generated roster (13 + 2 named = 15 total).
  for i in 1..13 loop
    v_email := 'savers' || lpad(i::text, 2, '0') || '@example.test';
    v_name := 'Savers Member ' || lpad(i::text, 2, '0');
    insert into auth.users
      (id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       is_sso_user, is_anonymous)
    values
      (('d0000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
       'authenticated', 'authenticated',
       v_email, extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v_name), now(), now(), false, false)
    on conflict (email) where is_sso_user = false do nothing;
  end loop;

  -- Soweto Uplift generated roster (27 + organizer = 28 total).
  for i in 1..27 loop
    v_email := 'uplift' || lpad(i::text, 2, '0') || '@example.test';
    v_name := 'Uplift Member ' || lpad(i::text, 2, '0');
    insert into auth.users
      (id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       is_sso_user, is_anonymous)
    values
      (('d0000001-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
       'authenticated', 'authenticated',
       v_email, extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v_name), now(), now(), false, false)
    on conflict (email) where is_sso_user = false do nothing;
  end loop;

  -- Tembisa Together generated roster (19 + organizer = 20 total).
  for i in 1..19 loop
    v_email := 'tembisa' || lpad(i::text, 2, '0') || '@example.test';
    v_name := 'Tembisa Member ' || lpad(i::text, 2, '0');
    insert into auth.users
      (id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       is_sso_user, is_anonymous)
    values
      (('d0000002-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
       'authenticated', 'authenticated',
       v_email, extensions.crypt('TestPass1', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', v_name), now(), now(), false, false)
    on conflict (email) where is_sso_user = false do nothing;
  end loop;
end $$;

-- Audit rows for seed writes are attributed to Nomsa.
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

-- Organizers first, then the rest. Membership is unique per (stokvel, user).
insert into public.stokvel_members (stokvel_id, user_id, role)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'organizer'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'organizer')
on conflict (stokvel_id, user_id) do nothing;

insert into public.stokvel_members (stokvel_id, user_id)
select 'aaaaaaaa-0000-0000-0000-000000000001', p.id
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'savers%@example.test'
on conflict (stokvel_id, user_id) do nothing;

insert into public.stokvel_members (stokvel_id, user_id)
select 'aaaaaaaa-0000-0000-0000-000000000002', p.id
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'uplift%@example.test'
on conflict (stokvel_id, user_id) do nothing;

insert into public.stokvel_members (stokvel_id, user_id)
select 'aaaaaaaa-0000-0000-0000-000000000003', p.id
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'tembisa%@example.test'
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

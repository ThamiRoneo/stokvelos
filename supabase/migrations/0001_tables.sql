-- 0001_tables.sql — all tables, constraints and indexes (IMPLEMENTATION_PLAN §8.1–8.4).

create extension if not exists pgcrypto;

-- One person's public profile. Created by the handle_new_user trigger (0004).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  is_admin boolean not null default false
);

comment on column public.profiles.is_admin is
  'Platform Admin flag (§18 C2). Set only in Supabase; never self-settable (SEC2).';

-- A stokvel group.
create table if not exists public.stokvels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  contribution_amount numeric(12,2) not null
    check (contribution_amount > 0 and contribution_amount <= 1000000),
  contribution_frequency text not null
    check (contribution_frequency in ('weekly', 'monthly')),
  currency text not null default 'ZAR',
  rotation_order jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership and role. A user may belong to many stokvels (BR13).
create table if not exists public.stokvel_members (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('organizer', 'member')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  joined_at timestamptz not null default now(),
  unique (stokvel_id, user_id)
);

-- Invite links (BR6: 7 days, single-use unless reusable).
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references public.profiles (id),
  invited_email text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  reusable boolean not null default false
);

-- Group ledger rows (BR4). One row per member per period.
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  member_id uuid not null references public.stokvel_members (id),
  amount numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  period_label text not null check (char_length(period_label) between 1 and 50),
  note text check (note is null or char_length(note) <= 500),
  recorded_by uuid not null references public.profiles (id),
  recorded_at timestamptz not null default now(),
  unique (stokvel_id, member_id, period_label)
);

-- Scheduled and completed payouts (BR5).
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  member_id uuid not null references public.stokvel_members (id),
  amount numeric(14,2) not null check (amount > 0 and amount <= 10000000),
  scheduled_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'paid', 'cancelled')),
  paid_at timestamptz,
  recorded_by uuid not null references public.profiles (id),
  note text check (note is null or char_length(note) <= 500)
);

-- Member-raised questions (BR3, BR10).
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  raised_by uuid not null references public.profiles (id),
  subject_type text not null
    check (subject_type in ('contribution', 'payout', 'stokvel')),
  subject_id uuid,
  description text not null check (char_length(description) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000)
);

-- Immutable change history (BR8, BR9). Written only by triggers (0004).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  stokvel_id uuid not null references public.stokvels (id) on delete cascade,
  actor_id uuid not null references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Indexes (§8.4). invitations.token is indexed by its unique constraint.
create index if not exists stokvel_members_user_id_idx
  on public.stokvel_members (user_id);
create index if not exists stokvel_members_stokvel_id_role_idx
  on public.stokvel_members (stokvel_id, role);
create index if not exists contributions_stokvel_period_member_idx
  on public.contributions (stokvel_id, period_label, member_id);
create index if not exists payouts_stokvel_scheduled_date_idx
  on public.payouts (stokvel_id, scheduled_date);
create index if not exists payouts_member_status_idx
  on public.payouts (member_id, status);
create index if not exists disputes_stokvel_status_idx
  on public.disputes (stokvel_id, status);
create index if not exists audit_log_stokvel_created_idx
  on public.audit_log (stokvel_id, created_at desc);

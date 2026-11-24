-- T-DB-1: every table and key column in IMPLEMENTATION_PLAN §8.1 exists with the right type.
begin;
select plan(34);

select has_table('public', 'profiles', 'T-DB-1 profiles exists');
select has_table('public', 'stokvels', 'T-DB-1 stokvels exists');
select has_table('public', 'stokvel_members', 'T-DB-1 stokvel_members exists');
select has_table('public', 'invitations', 'T-DB-1 invitations exists');
select has_table('public', 'contributions', 'T-DB-1 contributions exists');
select has_table('public', 'payouts', 'T-DB-1 payouts exists');
select has_table('public', 'disputes', 'T-DB-1 disputes exists');
select has_table('public', 'audit_log', 'T-DB-1 audit_log exists');

select has_column('public', 'profiles', 'is_admin', 'T-DB-1 profiles.is_admin exists');
select col_type_is('public', 'profiles', 'is_admin', 'boolean', 'T-DB-1 is_admin is boolean');
select has_column('public', 'stokvels', 'rotation_order', 'T-DB-1 rotation_order exists');
select col_type_is('public', 'stokvels', 'rotation_order', 'jsonb', 'T-DB-1 rotation_order is jsonb');
select col_type_is('public', 'stokvels', 'contribution_amount', 'numeric(12,2)',
  'T-DB-1 contribution_amount is numeric(12,2)');
select has_column('public', 'stokvels', 'contribution_frequency',
  'T-DB-1 contribution_frequency exists');
select has_column('public', 'stokvel_members', 'status',
  'T-DB-1 stokvel_members.status exists');
select col_type_is('public', 'stokvel_members', 'joined_at', 'timestamp with time zone',
  'T-DB-1 joined_at is timestamptz');
select has_column('public', 'invitations', 'token', 'T-DB-1 invitations.token exists');
select col_type_is('public', 'invitations', 'expires_at', 'timestamp with time zone',
  'T-DB-1 expires_at is timestamptz');
select col_type_is('public', 'contributions', 'amount', 'numeric(12,2)',
  'T-DB-1 contribution amount is numeric(12,2)');
select has_column('public', 'contributions', 'period_label',
  'T-DB-1 period_label exists');
select col_type_is('public', 'payouts', 'amount', 'numeric(14,2)',
  'T-DB-1 payout amount is numeric(14,2)');
select col_type_is('public', 'payouts', 'scheduled_date', 'date',
  'T-DB-1 scheduled_date is date');
select has_column('public', 'disputes', 'resolution_note',
  'T-DB-1 resolution_note exists');
select has_column('public', 'audit_log', 'before', 'T-DB-1 audit before exists');
select has_column('public', 'audit_log', 'after', 'T-DB-1 audit after exists');
select col_type_is('public', 'audit_log', 'created_at', 'timestamp with time zone',
  'T-DB-1 audit created_at is timestamptz');

select has_index('public', 'stokvel_members', 'stokvel_members_user_id_idx',
  'T-DB-1 stokvel_members user_id index exists');
select has_index('public', 'contributions', 'contributions_stokvel_period_member_idx',
  'T-DB-1 contributions ledger index exists');
select has_index('public', 'payouts', 'payouts_stokvel_scheduled_date_idx',
  'T-DB-1 payouts schedule index exists');
select has_index('public', 'disputes', 'disputes_stokvel_status_idx',
  'T-DB-1 disputes status index exists');
select has_index('public', 'audit_log', 'audit_log_stokvel_created_idx',
  'T-DB-1 audit chronological index exists');

select has_trigger('public', 'stokvels', 'trg_audit_stokvel',
  'T-DB-1 stokvel audit trigger exists');
select has_trigger('public', 'audit_log', 'trg_block_audit_write',
  'T-DB-1 audit immutability trigger exists');
select has_function('public', 'join_invite', array['uuid'],
  'T-DB-1 join_invite RPC exists');

select * from finish();
rollback;

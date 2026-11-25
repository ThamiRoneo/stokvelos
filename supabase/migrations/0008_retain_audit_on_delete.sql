-- 0008_retain_audit_on_delete.sql — OP9/M4 keep audit history after deletion.
-- PRD: deleting a stokvel or account keeps the audit trail anonymised
-- indefinitely. Cascading deletes removed those rows, and the immutability
-- trigger blocked the FK SET NULL needed to retain them. Allow only the
-- system anonymisation (stokvel_id/actor_id -> NULL); all other writes stay
-- blocked, and authenticated users still have no UPDATE grant on audit_log.

alter table public.audit_log alter column stokvel_id drop not null;
alter table public.audit_log alter column actor_id drop not null;

alter table public.audit_log drop constraint audit_log_stokvel_id_fkey;
alter table public.audit_log add constraint audit_log_stokvel_id_fkey
  foreign key (stokvel_id) references public.stokvels(id) on delete set null;

alter table public.audit_log drop constraint audit_log_actor_id_fkey;
alter table public.audit_log add constraint audit_log_actor_id_fkey
  foreign key (actor_id) references public.profiles(id) on delete set null;

create or replace function public.block_audit_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.id = old.id
     and new.action = old.action
     and new.entity_type = old.entity_type
     and new.entity_id = old.entity_id
     and new.before is not distinct from old.before
     and new.after is not distinct from old.after
     and new.created_at = old.created_at
     and (new.stokvel_id is null or new.stokvel_id = old.stokvel_id)
     and (new.actor_id is null or new.actor_id = old.actor_id)
     and ((new.stokvel_id is null and old.stokvel_id is not null)
          or (new.actor_id is null and old.actor_id is not null))
  then
    return new; -- FK anonymisation from a parent delete only
  end if;
  raise exception 'Audit log entries are immutable.';
end;
$$;

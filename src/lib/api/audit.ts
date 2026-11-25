import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { listMembers } from "./stokvels";
import { fail, mapError, ok, type Result } from "./types";

export type AuditEntry = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown | null;
  after: unknown | null;
  createdAt: string;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: unknown | null;
  after: unknown | null;
  created_at: string;
};

/**
 * SEC1 lets a user read only their own profile, so names for other actors are
 * unavailable through a direct profile query. Derive them from the roster and
 * fall back to a neutral non-empty label.
 */
const FALLBACK_ACTOR_NAME = "Member";
const AUDIT_COLUMNS =
  "id, actor_id, action, entity_type, entity_id, before, after, created_at";

async function currentUserId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

/** RLS is authoritative; this is defence in depth for exact boundary copy. */
async function isMember(
  client: SupabaseClient,
  stokvelId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from("stokvel_members")
    .select("id")
    .eq("stokvel_id", stokvelId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

/** OP22 / SEC18 — read-only, newest-first immutable change history. */
export async function getAuditLog(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<AuditEntry[]>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!(await isMember(client, stokvelId, userId)))
    return fail(MESSAGES.couldNotLoad);

  const { data, error } = await client
    .from("audit_log")
    .select(AUDIT_COLUMNS)
    .eq("stokvel_id", stokvelId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  const roster = await listMembers(client, stokvelId);
  const names = new Map<string, string>();
  if (roster.ok) {
    for (const member of roster.data) {
      names.set(member.userId, member.fullName || FALLBACK_ACTOR_NAME);
    }
  }

  return ok(
    (data ?? []).map((row: AuditRow): AuditEntry => {
      const actorId = row.actor_id ?? "";
      return {
        id: row.id,
        actorId,
        actorName: names.get(actorId) || FALLBACK_ACTOR_NAME,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        before: row.before ?? null,
        after: row.after ?? null,
        createdAt: row.created_at,
      };
    }),
  );
}

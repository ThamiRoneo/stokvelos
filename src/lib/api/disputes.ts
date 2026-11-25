import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { fail, mapError, ok, type Result } from "./types";

export type DisputeSubjectType = "contribution" | "payout" | "stokvel";

export type RaiseDisputeInput = {
  stokvelId: string;
  subjectType: DisputeSubjectType;
  subjectId?: string | null;
  description: string;
};

export type ResolveDisputeInput = {
  stokvelId: string;
  disputeId: string;
  resolutionNote: string;
};

export type DisputeRecord = {
  id: string;
  stokvelId: string;
  raisedBy: string;
  subjectType: string;
  subjectId: string | null;
  description: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
};

type DisputeRow = {
  id: string;
  stokvel_id: string;
  raised_by: string;
  subject_type: string;
  subject_id: string | null;
  description: string;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
};

const SUBJECT_TYPES: readonly string[] = ["contribution", "payout", "stokvel"];
const MAX_TEXT_LENGTH = 2000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPUTE_COLUMNS =
  "id, stokvel_id, raised_by, subject_type, subject_id, description, status, resolved_by, resolved_at, resolution_note";

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

async function isOrganizer(
  client: SupabaseClient,
  stokvelId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from("stokvel_members")
    .select("id")
    .eq("stokvel_id", stokvelId)
    .eq("user_id", userId)
    .eq("role", "organizer")
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

function toRecord(row: DisputeRow): DisputeRecord {
  return {
    id: row.id,
    stokvelId: row.stokvel_id,
    raisedBy: row.raised_by,
    subjectType: row.subject_type,
    subjectId: row.subject_id ?? null,
    description: row.description,
    status: row.status,
    resolvedBy: row.resolved_by ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolutionNote: row.resolution_note ?? null,
  };
}

/** OP20 — a member opens a dispute; triggers write the organizer notice. */
export async function raiseDispute(
  client: SupabaseClient,
  input: RaiseDisputeInput,
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  if (!(await isMember(client, input.stokvelId, userId)))
    return fail(MESSAGES.onlyMembersDispute);

  if (!SUBJECT_TYPES.includes(input.subjectType))
    return fail(MESSAGES.couldNotSave);

  const description = input.description?.trim() ?? "";
  if (description.length < 1 || description.length > MAX_TEXT_LENGTH)
    return fail(MESSAGES.couldNotSave);

  let subjectId: string | null = null;
  if (input.subjectId != null) {
    if (
      typeof input.subjectId !== "string" ||
      !UUID_PATTERN.test(input.subjectId)
    )
      return fail(MESSAGES.couldNotSave);
    subjectId = input.subjectId;
  }

  // AFTER INSERT triggers write the "New dispute raised" notice. Application
  // code never inserts notifications or audit rows itself.
  const id = crypto.randomUUID();
  const { error } = await client.from("disputes").insert({
    id,
    stokvel_id: input.stokvelId,
    raised_by: userId,
    subject_type: input.subjectType,
    subject_id: subjectId,
    description,
    status: "open",
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
  });
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok({ id });
}

/** OP21 — organizer resolves; the status change trigger writes audit + notice. */
export async function resolveDispute(
  client: SupabaseClient,
  input: ResolveDisputeInput,
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!(await isOrganizer(client, input.stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);

  // Scope the existence check to the stokvel so an organizer cannot resolve a
  // dispute in a different group. RLS enforces the same boundary.
  const { data: existing } = await client
    .from("disputes")
    .select("id")
    .eq("id", input.disputeId)
    .eq("stokvel_id", input.stokvelId)
    .maybeSingle();
  if (!existing) return fail(MESSAGES.couldNotLoad);

  const resolutionNote = input.resolutionNote?.trim() ?? "";
  if (resolutionNote.length < 1 || resolutionNote.length > MAX_TEXT_LENGTH)
    return fail(MESSAGES.couldNotSave);

  const { data, error } = await client
    .from("disputes")
    .update({
      status: "resolved",
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
    })
    .eq("id", input.disputeId)
    .eq("stokvel_id", input.stokvelId)
    .select("id")
    .maybeSingle();
  if (error || !data) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok({ id: data.id });
}

/** OP22 — members read their group's disputes (SEC15); outsiders get a denial. */
export async function getDisputes(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<DisputeRecord[]>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!(await isMember(client, stokvelId, userId)))
    return fail(MESSAGES.couldNotLoad);

  const { data, error } = await client
    .from("disputes")
    .select(DISPUTE_COLUMNS)
    .eq("stokvel_id", stokvelId)
    .order("id", { ascending: false });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  return ok((data ?? []).map((row: DisputeRow) => toRecord(row)));
}

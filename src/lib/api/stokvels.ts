import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import {
  fail,
  mapError,
  ok,
  toMember,
  toStokvel,
  type Frequency,
  type Member,
  type Result,
  type Stokvel,
} from "./types";

type StokvelInput = {
  name: string;
  description?: string | null;
  contributionAmount: number;
  contributionFrequency: Frequency;
};

async function currentUserId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

async function isOrganizer(
  client: SupabaseClient,
  stokvelId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
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

/** OP7 — create a group; the creator becomes organizer via DB trigger. */
export async function createStokvel(
  client: SupabaseClient,
  input: StokvelInput,
): Promise<Result<Stokvel>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!input.name.trim()) return fail(MESSAGES.stokvelNameRequired);
  if (!Number.isFinite(input.contributionAmount) ||
      input.contributionAmount <= 0 ||
      input.contributionAmount > 1_000_000)
    return fail(MESSAGES.amountRange);

  // Do not use INSERT ... RETURNING here: the SELECT RLS policy checks
  // membership, which the AFTER INSERT trigger has not created yet. Insert
  // with a client-generated id, then read the row back once the trigger ran.
  const id = crypto.randomUUID();
  const { error } = await client.from("stokvels").insert({
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    contribution_amount: input.contributionAmount,
    contribution_frequency: input.contributionFrequency,
    created_by: userId,
  });
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));

  const { data, error: readError } = await client
    .from("stokvels")
    .select()
    .eq("id", id)
    .single();
  if (readError || !data) return fail(mapError(readError, MESSAGES.couldNotSave));

  // BR11: rotation defaults to join order.
  const { data: members } = await client
    .from("stokvel_members")
    .select("id")
    .eq("stokvel_id", data.id)
    .order("joined_at", { ascending: true })
    .order("id", { ascending: true });
  const order = (members ?? []).map((member: { id: string }) => member.id);
  await client.from("stokvels").update({ rotation_order: order }).eq("id", data.id);

  return ok(toStokvel({ ...data, rotation_order: order }));
}

/** S4 — only groups the signed-in user belongs to (SEC3). */
export async function listMyStokvels(client: SupabaseClient): Promise<Result<Stokvel[]>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const { data, error } = await client
    .from("stokvel_members")
    .select("stokvels(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  const groups = (data ?? [])
    .map((row: { stokvels: unknown }) => {
      const nested = row.stokvels;
      return Array.isArray(nested) ? nested[0] : nested;
    })
    .filter((row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .map((row) => toStokvel(row as Parameters<typeof toStokvel>[0]));
  return ok(groups);
}

/** S7/S10/S12 header — RLS denies non-members. */
export async function getStokvel(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<Stokvel>> {
  const { data, error } = await client
    .from("stokvels")
    .select()
    .eq("id", stokvelId)
    .maybeSingle();
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));
  if (!data) return fail(MESSAGES.couldNotLoad);
  return ok(toStokvel(data as Parameters<typeof toStokvel>[0]));
}

/** OP8 — organizer only (SEC5). */
export async function updateStokvel(
  client: SupabaseClient,
  stokvelId: string,
  input: Partial<StokvelInput>,
): Promise<Result<Stokvel>> {
  const userId = await currentUserId(client);
  if (!(await isOrganizer(client, stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);
  if (input.name !== undefined && !input.name.trim())
    return fail(MESSAGES.stokvelNameRequired);
  if (input.contributionAmount !== undefined &&
      (input.contributionAmount <= 0 || input.contributionAmount > 1_000_000))
    return fail(MESSAGES.amountRange);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.contributionAmount !== undefined) patch.contribution_amount = input.contributionAmount;
  if (input.contributionFrequency !== undefined) patch.contribution_frequency = input.contributionFrequency;

  const { data, error } = await client
    .from("stokvels")
    .update(patch)
    .eq("id", stokvelId)
    .select()
    .single();
  if (error || !data) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok(toStokvel(data as Parameters<typeof toStokvel>[0]));
}

/** OP9 — organizer only; cascades to ledger, payouts and disputes. */
export async function deleteStokvel(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<void>> {
  const userId = await currentUserId(client);
  if (!(await isOrganizer(client, stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);
  const { data, error } = await client
    .from("stokvels")
    .delete()
    .eq("id", stokvelId)
    .select("id");
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  if (!data?.length) return fail(MESSAGES.onlyOrganizer);
  return ok(undefined);
}

/** OP12 — member roster with role badges and join dates (SEC6). */
export async function listMembers(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<Member[]>> {
  const { data, error } = await client
    .from("stokvel_members")
    .select("id, user_id, role, status, joined_at, profiles(full_name)")
    .eq("stokvel_id", stokvelId)
    .order("joined_at", { ascending: true });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));
  return ok((data ?? []).map((row) => toMember(row as Parameters<typeof toMember>[0])));
}

/** OP14 — BR7 is enforced by the DB trigger, which raises the exact copy. */
export async function removeMember(
  client: SupabaseClient,
  stokvelMemberId: string,
): Promise<Result<void>> {
  const { data, error } = await client
    .from("stokvel_members")
    .delete()
    .eq("id", stokvelMemberId)
    .select("id");
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  if (!data?.length) return fail(MESSAGES.onlyOrganizer);
  return ok(undefined);
}

/** OP15 — rotation order saved; default is join order (BR11). */
export async function setRotationOrder(
  client: SupabaseClient,
  stokvelId: string,
  orderedMemberIds: string[],
): Promise<Result<void>> {
  const userId = await currentUserId(client);
  if (!(await isOrganizer(client, stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);

  const { data, error } = await client
    .from("stokvels")
    .update({ rotation_order: orderedMemberIds })
    .eq("id", stokvelId)
    .select("id");
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  if (!data?.length) return fail(MESSAGES.onlyOrganizer);
  return ok(undefined);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { fail, mapError, ok, type Result } from "./types";
import { listMembers } from "./stokvels";

export type RecordContributionInput = {
  stokvelId: string;
  memberId: string;
  amount: number;
  periodLabel: string;
  note?: string | null;
};

export type ContributionRecord = {
  id: string;
  stokvelId: string;
  memberId: string;
  memberName: string;
  amount: number;
  periodLabel: string;
  note: string | null;
  recordedAt: string;
};

export type LedgerData = {
  rows: ContributionRecord[];
  totals: { total: number };
  periods: string[];
  members: { id: string; name: string }[];
};

export type MemberStatement = {
  memberId: string;
  memberName: string;
  total: number;
  rows: ContributionRecord[];
};

type ContributionRow = {
  id: string;
  stokvel_id: string;
  member_id: string;
  amount: number | string;
  period_label: string;
  note: string | null;
  recorded_at: string;
};

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 1_000_000;

/**
 * SEC1 lets a user read only their own profile. A neutral label keeps names
 * in own-statement responses stable for every caller and avoids trying to
 * bypass that policy from application code.
 */
const NEUTRAL_MEMBER_NAME = "Member";

/** T-BR4-1 — the same guard the DB trigger enforces, for exact boundary copy. */
export function validateContributionAmount(amount: number): Result<true> {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < MIN_AMOUNT ||
    amount > MAX_AMOUNT
  ) {
    return fail(MESSAGES.amountRange);
  }
  return ok(true);
}

async function currentUserId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

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

const CONTRIBUTION_COLUMNS =
  "id, stokvel_id, member_id, amount, period_label, note, recorded_at";

function toRecord(row: ContributionRow, memberName: string): ContributionRecord {
  return {
    id: row.id,
    stokvelId: row.stokvel_id,
    memberId: row.member_id,
    memberName,
    amount: Number(row.amount),
    periodLabel: row.period_label,
    note: row.note ?? null,
    recordedAt: row.recorded_at,
  };
}

function totalOf(rows: ContributionRecord[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

async function memberNameForCopy(
  client: SupabaseClient,
  stokvelId: string,
  memberId: string,
): Promise<string> {
  const roster = await listMembers(client, stokvelId);
  if (!roster.ok) return NEUTRAL_MEMBER_NAME;
  return roster.data.find((member) => member.id === memberId)?.fullName ??
    NEUTRAL_MEMBER_NAME;
}

/** OP16 — organizer records one contribution per member and period (BR4/BR9). */
export async function recordContribution(
  client: SupabaseClient,
  input: RecordContributionInput,
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const amount = validateContributionAmount(input.amount);
  if (!amount.ok) return fail(amount.message);

  const periodLabel = input.periodLabel?.trim() ?? "";
  const note = input.note?.trim() || null;
  if (periodLabel.length < 1 || periodLabel.length > 50) return fail(MESSAGES.couldNotSave);
  if (note !== null && note.length > 500) return fail(MESSAGES.couldNotSave);

  if (!(await isOrganizer(client, input.stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);

  // The insert policy checks the organizer of stokvel_id but not that
  // member_id belongs to that stokvel; enforce that boundary here too.
  const { data: target } = await client
    .from("stokvel_members")
    .select("id")
    .eq("id", input.memberId)
    .eq("stokvel_id", input.stokvelId)
    .eq("status", "active")
    .maybeSingle();
  if (!target) return fail(MESSAGES.couldNotSave);

  // The AFTER INSERT trigger writes the single audit row (BR9). Insert without
  // RETURNING: all fields are already known, so no read-back is needed.
  const id = crypto.randomUUID();
  const { error } = await client.from("contributions").insert({
    id,
    stokvel_id: input.stokvelId,
    member_id: input.memberId,
    amount: input.amount,
    period_label: periodLabel,
    note,
    recorded_by: userId,
  });
  if (error) {
    if (error.code === "23505" || /duplicate key|unique constraint/i.test(error.message)) {
      const name = await memberNameForCopy(client, input.stokvelId, input.memberId);
      return fail(MESSAGES.duplicateContribution(name, periodLabel));
    }
    return fail(mapError(error, MESSAGES.couldNotSave));
  }
  return ok({ id });
}

/** OP17 — SEC11-read ledger with totals, period list and roster names. */
export async function getLedger(
  client: SupabaseClient,
  stokvelId: string,
  memberId?: string,
): Promise<Result<LedgerData>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!(await isMember(client, stokvelId, userId))) return fail(MESSAGES.couldNotLoad);

  const roster = await listMembers(client, stokvelId);
  if (!roster.ok) return fail(roster.message);
  const names = new Map(roster.data.map((member) => [member.id, member.fullName]));

  let query = client
    .from("contributions")
    .select(CONTRIBUTION_COLUMNS)
    .eq("stokvel_id", stokvelId);
  if (memberId) query = query.eq("member_id", memberId);

  const { data, error } = await query
    .order("period_label", { ascending: true })
    .order("recorded_at", { ascending: true });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  const rows = (data ?? []).map((row: ContributionRow) =>
    toRecord(row, names.get(row.member_id) ?? NEUTRAL_MEMBER_NAME),
  );
  return ok({
    rows,
    totals: { total: totalOf(rows) },
    periods: Array.from(new Set(rows.map((row) => row.periodLabel))).sort(),
    members: roster.data.map((member) => ({ id: member.id, name: member.fullName })),
  });
}

/** OP17 — the signed-in member's own statement, derived from auth.getUser(). */
export async function getMemberStatement(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<MemberStatement>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const { data: own, error: ownError } = await client
    .from("stokvel_members")
    .select("id")
    .eq("stokvel_id", stokvelId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (ownError || !own) return fail(mapError(ownError, MESSAGES.couldNotLoad));

  const { data, error } = await client
    .from("contributions")
    .select(CONTRIBUTION_COLUMNS)
    .eq("stokvel_id", stokvelId)
    .eq("member_id", own.id)
    .order("period_label", { ascending: true })
    .order("recorded_at", { ascending: true });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  const rows = (data ?? []).map((row: ContributionRow) =>
    toRecord(row, NEUTRAL_MEMBER_NAME),
  );
  return ok({
    memberId: own.id,
    memberName: NEUTRAL_MEMBER_NAME,
    total: totalOf(rows),
    rows,
  });
}

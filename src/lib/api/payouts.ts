import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { listMembers } from "./stokvels";
import { fail, mapError, ok, type Result } from "./types";

export type SchedulePayoutInput = {
  stokvelId: string;
  memberId: string;
  amount: number;
  scheduledDate: string;
  note?: string | null;
};

export type MarkPayoutPaidInput = {
  stokvelId: string;
  payoutId: string;
  paidAt: string;
  note?: string | null;
};

export type PayoutRecord = {
  id: string;
  stokvelId: string;
  memberId: string;
  amount: number;
  scheduledDate: string;
  status: string;
  paidAt: string | null;
  note: string | null;
  recordedBy: string;
};

export type PayoutData = {
  rows: PayoutRecord[];
  rotationOrder: string[];
  nextMemberId: string | null;
};

type PayoutRow = {
  id: string;
  stokvel_id: string;
  member_id: string;
  amount: number | string;
  scheduled_date: string;
  status: string;
  paid_at: string | null;
  note: string | null;
  recorded_by: string;
};

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 10_000_000;
const MAX_NOTE_LENGTH = 500;
const PAYOUT_COLUMNS =
  "id, stokvel_id, member_id, amount, scheduled_date, status, paid_at, note, recorded_by";

/** T-BR5-1 — the same guard the DB trigger enforces, for exact boundary copy. */
export function validatePayoutAmount(amount: number): Result<true> {
  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < MIN_AMOUNT ||
    amount > MAX_AMOUNT
  ) {
    return fail(MESSAGES.payoutAmountRange);
  }
  return ok(true);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  );
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))
    return false;
  return Number.isFinite(Date.parse(value));
}

function trimmedNote(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
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

function toRecord(row: PayoutRow): PayoutRecord {
  return {
    id: row.id,
    stokvelId: row.stokvel_id,
    memberId: row.member_id,
    amount: Number(row.amount),
    scheduledDate: row.scheduled_date,
    status: row.status,
    paidAt: row.paid_at ?? null,
    note: row.note ?? null,
    recordedBy: row.recorded_by,
  };
}

/** OP18 — organizer schedules one payout; triggers write audit + due notices. */
export async function schedulePayout(
  client: SupabaseClient,
  input: SchedulePayoutInput,
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const amount = validatePayoutAmount(input.amount);
  if (!amount.ok) return fail(amount.message);
  if (!isValidDate(input.scheduledDate)) return fail(MESSAGES.couldNotSave);

  const note = trimmedNote(input.note);
  if (note !== null && note.length > MAX_NOTE_LENGTH)
    return fail(MESSAGES.couldNotSave);

  if (!(await isOrganizer(client, input.stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);

  // The insert policy checks the organizer of stokvel_id but not that the
  // target member belongs to the same stokvel; enforce that boundary here.
  const { data: target } = await client
    .from("stokvel_members")
    .select("id")
    .eq("id", input.memberId)
    .eq("stokvel_id", input.stokvelId)
    .eq("status", "active")
    .maybeSingle();
  if (!target) return fail(MESSAGES.couldNotSave);

  // AFTER INSERT triggers write exactly one audit row and, for a date within
  // three days, the organizer + recipient due notifications. No manual writes.
  const id = crypto.randomUUID();
  const { error } = await client.from("payouts").insert({
    id,
    stokvel_id: input.stokvelId,
    member_id: input.memberId,
    amount: input.amount,
    scheduled_date: input.scheduledDate,
    status: "scheduled",
    paid_at: null,
    note,
    recorded_by: userId,
  });
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok({ id });
}

/** OP19 — organizer marks a scheduled payout paid; the trigger writes audit. */
export async function markPayoutPaid(
  client: SupabaseClient,
  input: MarkPayoutPaidInput,
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!isValidTimestamp(input.paidAt)) return fail(MESSAGES.couldNotSave);

  const note = trimmedNote(input.note);
  if (note !== null && note.length > MAX_NOTE_LENGTH)
    return fail(MESSAGES.couldNotSave);

  if (!(await isOrganizer(client, input.stokvelId, userId)))
    return fail(MESSAGES.onlyOrganizer);

  // Scoping the existence check and the update to stokvel_id prevents a caller
  // from paying out a row in a different group they also organize.
  const { data: existing } = await client
    .from("payouts")
    .select("id")
    .eq("id", input.payoutId)
    .eq("stokvel_id", input.stokvelId)
    .maybeSingle();
  if (!existing) return fail(MESSAGES.couldNotLoad);

  const patch: Record<string, unknown> = {
    status: "paid",
    paid_at: input.paidAt,
  };
  // An omitted note leaves the existing note untouched; an explicit null clears it.
  if (input.note !== undefined) patch.note = note;

  const { data, error } = await client
    .from("payouts")
    .update(patch)
    .eq("id", input.payoutId)
    .eq("stokvel_id", input.stokvelId)
    .select("id")
    .maybeSingle();
  if (error || !data) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok({ id: data.id });
}

/** S9 — payout history plus BR11 rotation position, readable by members only. */
export async function getPayouts(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<PayoutData>> {
  const userId = await currentUserId(client);
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);
  if (!(await isMember(client, stokvelId, userId)))
    return fail(MESSAGES.couldNotLoad);

  const [groupResult, roster, payoutsResult] = await Promise.all([
    client
      .from("stokvels")
      .select("rotation_order")
      .eq("id", stokvelId)
      .maybeSingle(),
    listMembers(client, stokvelId),
    client
      .from("payouts")
      .select(PAYOUT_COLUMNS)
      .eq("stokvel_id", stokvelId)
      .order("scheduled_date", { ascending: true })
      .order("id", { ascending: true }),
  ]);
  if (groupResult.error || !groupResult.data)
    return fail(mapError(groupResult.error, MESSAGES.couldNotLoad));
  if (!roster.ok) return fail(roster.message);
  if (payoutsResult.error)
    return fail(mapError(payoutsResult.error, MESSAGES.couldNotLoad));

  const active = roster.data.filter((member) => member.status === "active");
  const activeIds = new Set(active.map((member) => member.id));
  const stored = Array.isArray(groupResult.data.rotation_order)
    ? groupResult.data.rotation_order.filter(
        (id): id is string => typeof id === "string",
      )
    : [];
  const derived = [...active]
    .sort(
      (a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.id.localeCompare(b.id),
    )
    .map((member) => member.id);
  // A stored order may be stale: createStokvel seeds it before invitees join,
  // and removed members can linger. Keep its relative order for active ids,
  // then append any active member it does not yet mention in join order (BR11).
  const known = [...new Set(stored.filter((id) => activeIds.has(id)))];
  const knownIds = new Set(known);
  const rotationOrder = [...known, ...derived.filter((id) => !knownIds.has(id))];

  const rows = (payoutsResult.data ?? []).map(
    (row: PayoutRow) => toRecord(row),
  );
  const accountedFor = new Set(
    rows
      .filter((row) => row.status === "scheduled" || row.status === "paid")
      .map((row) => row.memberId),
  );
  const nextMemberId =
    rotationOrder.find((id) => !accountedFor.has(id)) ?? null;

  return ok({ rows, rotationOrder, nextMemberId });
}

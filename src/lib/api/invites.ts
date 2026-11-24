import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { fail, mapError, ok, type InvitePreview, type Result } from "./types";

type CreatedInvite = { token: string; link: string; expiresAt: string };

/** OP10/OP13 — seven-day link; expiry is set by the DB default (BR6). */
export async function createInvite(
  client: SupabaseClient,
  input: { stokvelId: string; origin: string; invitedEmail?: string; reusable?: boolean },
): Promise<Result<CreatedInvite>> {
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const { data, error } = await client
    .from("invitations")
    .insert({
      stokvel_id: input.stokvelId,
      invited_by: userId,
      invited_email: input.invitedEmail?.trim() || null,
      reusable: input.reusable ?? false,
    })
    .select("token, expires_at")
    .single();
  if (error || !data) return fail(mapError(error, MESSAGES.couldNotSave));

  const link = `${input.origin.replace(/\/$/, "")}/join/${data.token}`;
  return ok({ token: data.token, link, expiresAt: data.expires_at });
}

/** S6 — safe group summary only; invitation rows remain organizer-only. */
export async function previewInvite(
  client: SupabaseClient,
  token: string,
): Promise<Result<InvitePreview>> {
  const { data, error } = await client.rpc("preview_invite", { p_token: token });
  if (error) return fail(mapError(error, MESSAGES.couldNotJoin));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return fail(MESSAGES.couldNotJoin);
  return ok({
    stokvelId: row.stokvel_id as string,
    name: row.name as string,
    description: row.description as string | null,
    contributionAmount: Number(row.contribution_amount),
    contributionFrequency: row.contribution_frequency as InvitePreview["contributionFrequency"],
    memberCount: Number(row.member_count),
  });
}

/** OP11/SEC19 — the security-definer RPC validates expiry and single use. */
export async function joinInvite(
  client: SupabaseClient,
  token: string,
): Promise<Result<string>> {
  const { data, error } = await client.rpc("join_invite", { p_token: token });
  if (error) return fail(mapError(error, MESSAGES.couldNotJoin));
  if (!data) return fail(MESSAGES.couldNotJoin);
  return ok(data as string);
}

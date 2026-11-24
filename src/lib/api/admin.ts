import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { fail, mapError, ok, type Result } from "./types";

export type AdminStats = { totalStokvels: number; totalMembers: number };

/** SEC21 — aggregate counts only; never member-level financial data. */
export async function getAdminStats(
  client: SupabaseClient,
): Promise<Result<AdminStats>> {
  const { data, error } = await client.rpc("admin_stats");
  if (error) return fail(mapError(error, MESSAGES.onlyOrganizer));
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return fail(MESSAGES.onlyOrganizer);
  return ok({
    totalStokvels: Number(row.total_stokvels),
    totalMembers: Number(row.total_members),
  });
}

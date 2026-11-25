import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { fail, mapError, ok, type Result } from "./types";

export type Notification = {
  id: string;
  userId: string;
  stokvelId: string;
  message: string;
  screen: string;
  createdAt: string;
  readAt: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  stokvel_id: string;
  message: string;
  screen: string;
  created_at: string;
  read_at: string | null;
};

/** OP24 — the signed-in caller's notifications only (RLS plus explicit filter). */
export async function getNotifications(
  client: SupabaseClient,
): Promise<Result<Notification[]>> {
  const { data } = await client.auth.getUser();
  const userId = data.user?.id ?? null;
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const { data: rows, error } = await client
    .from("notifications")
    .select("id, user_id, stokvel_id, message, screen, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) return fail(mapError(error, MESSAGES.couldNotLoad));

  return ok(
    (rows ?? []).map((row: NotificationRow): Notification => ({
      id: row.id,
      userId: row.user_id,
      stokvelId: row.stokvel_id,
      message: row.message,
      screen: row.screen,
      createdAt: row.created_at,
      readAt: row.read_at ?? null,
    })),
  );
}

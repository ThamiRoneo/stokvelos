import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const seedPassword = process.env.SEED_TEST_PASSWORD!;

export const IDS = {
  nomsa: "11111111-1111-1111-1111-111111111111",
  sipho: "22222222-2222-2222-2222-222222222222",
  sowetoSavers: "aaaaaaaa-0000-0000-0000-000000000001",
  nomsaSaversMember: "d0000000-0000-4000-8000-000000000001",
} as const;

export function anonClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function adminClient(): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInAs(email: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email,
    password: seedPassword,
  });
  if (error) throw new Error(`signInAs failed: ${error.message}`);
  return client;
}

export async function cleanupUser(email: string): Promise<void> {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
}

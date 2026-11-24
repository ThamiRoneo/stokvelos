import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { isValidPassword } from "@/lib/password";
import { fail, mapError, ok, type Result } from "./types";

type Consent = { acceptedAge: boolean; acceptedPrivacy: boolean };
type SignUpInput = Consent & {
  email: string;
  password: string;
  fullName?: string;
};

function consentMissing(input: Consent): boolean {
  return !input.acceptedAge || !input.acceptedPrivacy;
}

/** OP1 — email/password sign-up with the 18+ and privacy gates. */
export async function signUp(
  client: SupabaseClient,
  input: SignUpInput,
): Promise<Result<string>> {
  if (consentMissing(input)) return fail(MESSAGES.consentRequired);
  if (!isValidPassword(input.password)) return fail(MESSAGES.passwordRule);

  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { full_name: input.fullName?.trim() || null },
    },
  });

  if (error) return fail(mapError(error, MESSAGES.accountExists));
  // Supabase returns a user with no identities for an email that is already
  // registered when confirmations are enabled — treat that as the same error.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0)
    return fail(MESSAGES.accountExists);
  if (!data.user) return fail(MESSAGES.accountExists);
  return ok(data.user.id);
}

/** OP2 — email/password log-in. */
export async function signIn(
  client: SupabaseClient,
  input: { email: string; password: string },
): Promise<Result<void>> {
  const { error } = await client.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) return fail(mapError(error, MESSAGES.invalidCredentials));
  return ok(undefined);
}

/** OP1/OP2 — Google OAuth (§18 C17); consent is still required. */
export async function signInWithGoogle(
  client: SupabaseClient,
  input: Consent & { redirectTo?: string },
): Promise<Result<void>> {
  if (consentMissing(input)) return fail(MESSAGES.consentRequired);
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: input.redirectTo ? { redirectTo: input.redirectTo } : undefined,
  });
  if (error) return fail(mapError(error, MESSAGES.noConnection));
  return ok(undefined);
}

/** OP3 — clear the session. */
export async function signOut(client: SupabaseClient): Promise<Result<void>> {
  const { error } = await client.auth.signOut();
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok(undefined);
}

/** OP4 — always the same message, whatever the account state. */
export async function requestPasswordReset(
  client: SupabaseClient,
  email: string,
): Promise<Result<void>> {
  await client.auth.resetPasswordForEmail(email.trim());
  return ok(undefined);
}

/** OP6 — safe profile columns only (SEC2). */
export async function updateProfile(
  client: SupabaseClient,
  input: { fullName: string; phone: string | null },
): Promise<Result<void>> {
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fail(MESSAGES.pleaseLoginAgain);

  const { error } = await client
    .from("profiles")
    .update({ full_name: input.fullName.trim(), phone: input.phone })
    .eq("id", userId);
  if (error) return fail(mapError(error, MESSAGES.couldNotSave));
  return ok(undefined);
}

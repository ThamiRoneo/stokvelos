import { describe, it, expect, afterAll } from "vitest";
import { adminClient, anonClient, cleanupUser, seedPassword } from "./helpers";
import { requestPasswordReset, signIn, signOut, signUp, updateProfile } from "@/lib/api/auth";
import { MESSAGES } from "@/lib/messages";

describe("Phase 2 auth integration", () => {
  const createdEmails: string[] = [];

  afterAll(async () => {
    for (const email of createdEmails) await cleanupUser(email);
  });

  it("T-AUTH-1 signs up with the 18+ and privacy gates", async () => {
    const email = `phase2-auth-${Date.now()}@stokvelos.app`;
    createdEmails.push(email);
    const client = anonClient();

    const missing = await signUp(client, {
      email,
      password: seedPassword,
      acceptedAge: true,
      acceptedPrivacy: false,
    });
    expect(missing).toEqual({ ok: false, message: MESSAGES.consentRequired });

    const result = await signUp(client, {
      email,
      password: seedPassword,
      acceptedAge: true,
      acceptedPrivacy: true,
      fullName: "Test Person",
    });
    expect(result.ok).toBe(true);
  });

  it("T-AUTH-2 rejects duplicate sign-up with the exact PRD message", async () => {
    const client = anonClient();
    const result = await signUp(client, {
      email: "nomsa@stokvelos.app",
      password: seedPassword,
      acceptedAge: true,
      acceptedPrivacy: true,
    });
    expect(result).toEqual({ ok: false, message: MESSAGES.accountExists });
  });

  it("T-AUTH-3 signs in and rejects invalid credentials", async () => {
    const client = anonClient();
    const bad = await signIn(client, {
      email: "nomsa@stokvelos.app",
      password: "WrongPass1",
    });
    expect(bad).toEqual({ ok: false, message: MESSAGES.invalidCredentials });

    const ok = await signIn(client, {
      email: "nomsa@stokvelos.app",
      password: seedPassword,
    });
    expect(ok.ok).toBe(true);
  });

  it("T-AUTH-4 signs out and password reset always reports the same message", async () => {
    const client = anonClient();
    await signIn(client, { email: "nomsa@stokvelos.app", password: seedPassword });
    const out = await signOut(client);
    expect(out.ok).toBe(true);

    const reset = await requestPasswordReset(client, "missing@stokvelos.app");
    expect(reset).toEqual({ ok: true, data: undefined });
  });

  it("T-AUTH-5 updateProfile changes only safe profile fields", async () => {
    const admin = adminClient();
    const client = anonClient();
    await signIn(client, { email: "nomsa@stokvelos.app", password: seedPassword });

    const result = await updateProfile(client, {
      fullName: "Nomsa Test",
      phone: "0820000000",
    });
    expect(result.ok).toBe(true);

    const { data } = await admin
      .from("profiles")
      .select("full_name, phone, is_admin")
      .eq("id", "11111111-1111-1111-1111-111111111111")
      .single();
    expect(data?.full_name).toBe("Nomsa Test");
    expect(data?.phone).toBe("0820000000");
    expect(data?.is_admin).toBe(false);

    await admin
      .from("profiles")
      .update({ full_name: "Nomsa Dlamini", phone: null })
      .eq("id", "11111111-1111-1111-1111-111111111111");
  });
});

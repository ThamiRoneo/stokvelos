import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteAccount } from "@/lib/api/auth";
import { recordContribution } from "@/lib/api/contributions";
import { schedulePayout } from "@/lib/api/payouts";
import { createStokvel, listMembers } from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";
import { adminClient, anonClient, cleanupUser, seedPassword, signInAs } from "./helpers";

const DAY_MS = 86_400_000;

function futureDate(daysFromToday: number): string {
  return new Date(Date.now() + daysFromToday * DAY_MS).toISOString().slice(0, 10);
}

type TestUser = {
  email: string;
  id: string;
  fullName: string;
  client: SupabaseClient;
};

async function authUserExists(id: string): Promise<boolean> {
  const { data } = await adminClient().auth.admin.getUserById(id);
  return Boolean(data.user);
}

describe("Phase 6 delete account integration (OP5 / T-M4-1)", () => {
  const createdStokvelIds: string[] = [];
  const createdEmails: string[] = [];
  let sharedUsers: {
    creator: TestUser;
    memberOne: TestUser;
    memberTwo: TestUser;
    secondCaller: TestUser;
  } | null = null;

  /** Disposable auth users only — seeded identities are never mutated. */
  async function freshUser(label: string): Promise<TestUser> {
    const email = `delete-account-${label}-${crypto.randomUUID()}@stokvelos.app`;
    const fullName = `Delete Account ${label}`;
    createdEmails.push(email);

    const created = await adminClient().auth.admin.createUser({
      email,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (created.error || !created.data?.user) {
      throw new Error(
        `createUser failed: ${created.error?.message ?? "no user returned"}`,
      );
    }
    return {
      email,
      id: created.data.user.id,
      fullName,
      client: await signInAs(email),
    };
  }

  beforeAll(async () => {
    sharedUsers = {
      creator: await freshUser("Creator"),
      memberOne: await freshUser("MemberOne"),
      memberTwo: await freshUser("MemberTwo"),
      secondCaller: await freshUser("SecondCaller"),
    };
  }, 60_000);

  async function freshGroup() {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { creator, memberOne, memberTwo } = sharedUsers;

    const created = await createStokvel(creator.client, {
      name: `Delete Group ${crypto.randomUUID().slice(0, 8)}`,
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    if (!created.ok) throw new Error(`createStokvel failed: ${created.message}`);
    createdStokvelIds.push(created.data.id);

    // Three active members keep BR1's minimum-member guard from blocking the
    // creator's cascading membership removal when the account is deleted.
    const added = await adminClient().from("stokvel_members").insert([
      { stokvel_id: created.data.id, user_id: memberOne.id, role: "member" },
      { stokvel_id: created.data.id, user_id: memberTwo.id, role: "member" },
    ]);
    expect(added.error).toBeNull();

    const roster = await listMembers(creator.client, created.data.id);
    if (!roster.ok) throw new Error(`listMembers failed: ${roster.message}`);
    const creatorRow = roster.data.find((row) => row.userId === creator.id);
    if (!creatorRow) throw new Error("roster missing the creator's own member row");

    return { stokvelId: created.data.id, creatorMemberId: creatorRow.id };
  }

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      await admin.from("stokvels").delete().eq("id", id);
    }
    // Users deleted by the RPC are simply absent from this lookup; all other
    // disposable users are removed here so seeded identities stay untouched.
    for (const email of createdEmails) await cleanupUser(email);
  }, 60_000);

  it("deletes only the caller's own account via delete_account and anonymises their footprint", async () => {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { creator } = sharedUsers;
    const group = await freshGroup();
    const admin = adminClient();
    const scheduledDate = futureDate(10);

    const contribution = await recordContribution(creator.client, {
      stokvelId: group.stokvelId,
      memberId: group.creatorMemberId,
      amount: 250.5,
      periodLabel: "2026-W01",
      note: "Creator's own contribution",
    });
    expect(contribution.ok).toBe(true);
    if (!contribution.ok) return;

    const payout = await schedulePayout(creator.client, {
      stokvelId: group.stokvelId,
      memberId: group.creatorMemberId,
      amount: 3750,
      scheduledDate,
    });
    expect(payout.ok).toBe(true);
    if (!payout.ok) return;

    const { data: auditBefore } = await admin
      .from("audit_log")
      .select("id, actor_id")
      .eq("stokvel_id", group.stokvelId);
    expect((auditBefore ?? []).length).toBeGreaterThan(0);
    expect(auditBefore?.every((row) => row.actor_id === creator.id)).toBe(true);

    const result = await deleteAccount(creator.client);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBeUndefined();

    // Profile and auth identity are both gone (admin view, not RLS-filtered).
    const { data: profileAfter } = await admin
      .from("profiles")
      .select("id")
      .eq("id", creator.id);
    expect(profileAfter).toEqual([]);
    expect(await authUserExists(creator.id)).toBe(false);

    // The group and its ledger rows survive, with every reference to the
    // deleted person nulled rather than cascading away or being invented.
    const { data: stokvelAfter } = await admin
      .from("stokvels")
      .select("id, name, created_by")
      .eq("id", group.stokvelId);
    expect(stokvelAfter).toHaveLength(1);
    expect(stokvelAfter?.[0].created_by).toBeNull();

    const { data: contributionAfter } = await admin
      .from("contributions")
      .select("id, member_id, recorded_by, amount")
      .eq("id", contribution.data.id);
    expect(contributionAfter).toHaveLength(1);
    expect(contributionAfter?.[0].member_id).toBeNull();
    expect(contributionAfter?.[0].recorded_by).toBeNull();
    expect(contributionAfter?.[0].amount).toBe(250.5);

    const { data: payoutAfter } = await admin
      .from("payouts")
      .select("id, member_id, recorded_by, amount, scheduled_date")
      .eq("id", payout.data.id);
    expect(payoutAfter).toHaveLength(1);
    expect(payoutAfter?.[0].member_id).toBeNull();
    expect(payoutAfter?.[0].recorded_by).toBeNull();
    expect(payoutAfter?.[0].amount).toBe(3750);
    expect(payoutAfter?.[0].scheduled_date).toBe(scheduledDate);

    // Audit history is retained and anonymised, never rewritten or deleted.
    const { data: auditAfter } = await admin
      .from("audit_log")
      .select("id, actor_id")
      .eq("stokvel_id", group.stokvelId);
    expect((auditAfter ?? []).map((row) => row.id).sort()).toEqual(
      (auditBefore ?? []).map((row) => row.id).sort(),
    );
    expect(auditAfter?.every((row) => row.actor_id === null)).toBe(true);
  });

  it("returns the exact session and save error messages with no input beyond the client", async () => {
    expect(await deleteAccount(anonClient())).toEqual({
      ok: false,
      message: MESSAGES.pleaseLoginAgain,
    });

    // A signed-in caller whose delete_account RPC fails must get only the
    // generic save message — no raw database error may leak to the UI.
    const failingRpcClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: "rpc-failure-user" } } }),
      },
      rpc: async () => ({ data: null, error: { message: "secret RPC detail" } }),
    } as unknown as SupabaseClient;
    expect(await deleteAccount(failingRpcClient)).toEqual({
      ok: false,
      message: MESSAGES.couldNotSave,
    });

    expect(deleteAccount.length).toBeLessThanOrEqual(1);
  });

  it("a second signed-in user calling deleteAccount removes only the caller", async () => {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { secondCaller, memberOne } = sharedUsers;
    const admin = adminClient();

    expect(await authUserExists(memberOne.id)).toBe(true);

    const result = await deleteAccount(secondCaller.client);
    expect(result.ok).toBe(true);

    expect(await authUserExists(secondCaller.id)).toBe(false);
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", secondCaller.id);
    expect(callerProfile).toEqual([]);

    // The other signed-in user is untouched: no id is accepted as an input.
    expect(await authUserExists(memberOne.id)).toBe(true);
    const { data: survivorProfile } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", memberOne.id);
    expect(survivorProfile).toHaveLength(1);
    expect(survivorProfile?.[0].full_name).toBe(memberOne.fullName);
  });
});

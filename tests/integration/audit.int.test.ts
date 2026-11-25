import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getAuditLog } from "@/lib/api/audit";
import { recordContribution } from "@/lib/api/contributions";
import { raiseDispute, resolveDispute } from "@/lib/api/disputes";
import { schedulePayout } from "@/lib/api/payouts";
import { createStokvel, listMembers } from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";
import { adminClient, cleanupUser, seedPassword, signInAs } from "./helpers";

/** Exact trigger action labels from 0004_triggers.sql (§18 C8). */
const AUDIT_ACTIONS = {
  contribution: "Contribution recorded",
  payout: "Payout scheduled",
  disputeResolved: "Dispute resolved",
} as const;

/** Exact BR8 exception from block_audit_write(). */
const AUDIT_TAMPER_COPY = "Audit log entries are immutable.";

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

describe("Phase 5 audit log integration", () => {
  const createdStokvelIds: string[] = [];
  const createdEmails: string[] = [];
  let sharedUsers: {
    organizer: TestUser;
    member: TestUser;
    outsider: TestUser;
  } | null = null;

  /** Disposable auth users only — seeded identities are never mutated. */
  async function freshUser(label: string): Promise<TestUser> {
    const email = `audit-${label}-${crypto.randomUUID()}@stokvelos.app`;
    const fullName = `Audit ${label}`;
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

  // Auth-user creation is the slow part; create three identities once and give
  // every test its own stokvel, audit rows and dispute state.
  beforeAll(async () => {
    sharedUsers = {
      organizer: await freshUser("Organizer"),
      member: await freshUser("Member"),
      outsider: await freshUser("Outsider"),
    };
  }, 60_000);

  async function freshGroup() {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { organizer, member, outsider } = sharedUsers;

    const created = await createStokvel(organizer.client, {
      name: `Audit Group ${crypto.randomUUID().slice(0, 8)}`,
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    if (!created.ok) throw new Error(`createStokvel failed: ${created.message}`);
    createdStokvelIds.push(created.data.id);

    const added = await adminClient().from("stokvel_members").insert({
      stokvel_id: created.data.id,
      user_id: member.id,
      role: "member",
    });
    expect(added.error).toBeNull();

    const roster = await listMembers(organizer.client, created.data.id);
    if (!roster.ok) throw new Error(`listMembers failed: ${roster.message}`);
    const memberRow = roster.data.find((row) => row.userId === member.id);
    if (!memberRow) throw new Error("roster missing the plain member");

    return {
      stokvelId: created.data.id,
      organizer,
      member,
      outsider,
      memberId: memberRow.id,
    };
  }

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      // Cascades members/contributions/payouts; audit rows are retained and
      // anonymised by 0008_retain_audit_on_delete.sql.
      await admin.from("stokvels").delete().eq("id", id);
    }
    for (const email of createdEmails) await cleanupUser(email);
  }, 60_000);

  it("T-US11-1 / OP22 / SEC18 a member reads a chronological audit feed with actor, before/after and timestamp; an outsider is denied", async () => {
    const group = await freshGroup();

    const contribution = await recordContribution(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W53",
    });
    expect(contribution.ok).toBe(true);
    const payout = await schedulePayout(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 750,
      scheduledDate: futureDate(2),
    });
    expect(payout.ok).toBe(true);

    const result = await getAuditLog(group.member.client, group.stokvelId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = result.data;
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(row).toMatchObject({
        id: expect.any(String),
        actorId: expect.any(String),
        actorName: expect.any(String),
        action: expect.any(String),
        entityType: expect.any(String),
        entityId: expect.any(String),
        createdAt: expect.any(String),
      });
      expect(row).toHaveProperty("before");
      expect(row).toHaveProperty("after");
    }

    // Newest first (§18 C8), so timestamps must never increase.
    const times = rows.map((row) => Date.parse(row.createdAt));
    expect(times.every((time) => Number.isFinite(time))).toBe(true);
    expect([...times].sort((a, b) => b - a)).toEqual(times);

    expect(rows.map((row) => row.action)).toEqual(
      expect.arrayContaining([AUDIT_ACTIONS.contribution, AUDIT_ACTIONS.payout]),
    );
    if (!contribution.ok || !payout.ok) return;

    const contributionRow = rows.find(
      (row) => row.entityId === contribution.data.id,
    );
    expect(contributionRow?.action).toBe(AUDIT_ACTIONS.contribution);
    expect(contributionRow?.entityType).toBe("contribution");
    expect(contributionRow?.actorId).toBe(group.organizer.id);
    expect(contributionRow?.before).toBeNull();
    expect(contributionRow?.after).not.toBeNull();
    expect(JSON.stringify(contributionRow?.after)).toContain("2026-W53");

    const payoutRow = rows.find((row) => row.entityId === payout.data.id);
    expect(payoutRow?.action).toBe(AUDIT_ACTIONS.payout);
    expect(payoutRow?.entityType).toBe("payout");
    expect(payoutRow?.after).not.toBeNull();
    expect(JSON.stringify(payoutRow?.after)).toContain("scheduled");

    const denied = await getAuditLog(group.outsider.client, group.stokvelId);
    expect(denied).toEqual({ ok: false, message: MESSAGES.couldNotLoad });
  });

  it("T-EDGE-2 / BR8 direct UPDATE and DELETE attempts on audit_log are blocked", async () => {
    const group = await freshGroup();
    const contribution = await recordContribution(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W54",
    });
    expect(contribution.ok).toBe(true);
    if (!contribution.ok) return;

    const admin = adminClient();
    const { data: auditRows } = await admin
      .from("audit_log")
      .select("id, action")
      .eq("entity_type", "contribution")
      .eq("entity_id", contribution.data.id);
    expect(auditRows).toHaveLength(1);
    const auditId = auditRows?.[0]?.id;
    expect(typeof auditId).toBe("string");

    // Service-role calls bypass RLS, so the immutability trigger itself must
    // reject both attempts rather than a missing client grant.
    const update = await admin
      .from("audit_log")
      .update({ action: "tampered" })
      .eq("id", auditId!)
      .select("id");
    expect(update.error).not.toBeNull();
    expect(update.error?.message).toContain(AUDIT_TAMPER_COPY);

    const deletion = await admin
      .from("audit_log")
      .delete()
      .eq("id", auditId!)
      .select("id");
    expect(deletion.error).not.toBeNull();
    expect(deletion.error?.message).toContain(AUDIT_TAMPER_COPY);

    const { data: after } = await admin
      .from("audit_log")
      .select("id, action")
      .eq("id", auditId!);
    expect(after).toHaveLength(1);
    expect(after?.[0].action).toBe(AUDIT_ACTIONS.contribution);
  });

  it("T-BR9-1 trigger-owned audit rows use the exact §18 C8 action labels", async () => {
    const group = await freshGroup();
    const contribution = await recordContribution(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W55",
    });
    expect(contribution.ok).toBe(true);
    const payout = await schedulePayout(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 500,
      scheduledDate: futureDate(2),
    });
    expect(payout.ok).toBe(true);
    const dispute = await raiseDispute(group.member.client, {
      stokvelId: group.stokvelId,
      subjectType: "payout",
      subjectId: payout.ok ? payout.data.id : null,
      description: "Audit label fixture",
    });
    expect(dispute.ok).toBe(true);
    if (!dispute.ok) return;
    const resolved = await resolveDispute(group.organizer.client, {
      stokvelId: group.stokvelId,
      disputeId: dispute.data.id,
      resolutionNote: "Checked with the ledger.",
    });
    expect(resolved.ok).toBe(true);

    const result = await getAuditLog(group.member.client, group.stokvelId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        AUDIT_ACTIONS.contribution,
        AUDIT_ACTIONS.payout,
        AUDIT_ACTIONS.disputeResolved,
      ]),
    );

    const { data: disputeAudit } = await adminClient()
      .from("audit_log")
      .select("id, action, entity_type")
      .eq("entity_type", "dispute")
      .eq("entity_id", dispute.data.id)
      .eq("action", AUDIT_ACTIONS.disputeResolved);
    expect(disputeAudit).toHaveLength(1);
  });
});

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getPayouts,
  markPayoutPaid,
  schedulePayout,
  validatePayoutAmount,
} from "@/lib/api/payouts";
import { getNotifications } from "@/lib/api/notifications";
import { createStokvel, listMembers, setRotationOrder } from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";
import { adminClient, cleanupUser, seedPassword, signInAs } from "./helpers";

/**
 * Exact PRD §4.5 / 0006_notifications.sql copy. Dates are rendered by the DB
 * trigger as YYYY-MM-DD, so assert the same format here.
 */
const payoutDueCopy = (name: string, date: string): string =>
  `Payout due for ${name} on ${date}.`;

/** Exact BR5 copy from supabase/migrations/0003_functions.sql. */
const PAYOUT_AMOUNT_COPY = "Payout amount must be between R0.01 and R10,000,000.";

const AUDIT_ACTIONS = {
  scheduled: "Payout scheduled",
  paid: "Payout marked paid",
} as const;

type SchedulePayoutInput = Parameters<typeof schedulePayout>[1];

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

describe("Phase 4 payouts integration", () => {
  const createdStokvelIds: string[] = [];
  const createdEmails: string[] = [];
  let sharedUsers: {
    organizer: TestUser;
    recipient: TestUser;
    second: TestUser;
    outsider: TestUser;
  } | null = null;

  /** Disposable auth users only — no seeded identities are read or mutated. */
  async function freshUser(label: string): Promise<TestUser> {
    const email = `payout-${label}-${crypto.randomUUID()}@stokvelos.app`;
    const fullName = `Payout ${label}`;
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

  // Creating auth users is the slow part of this suite. Create four disposable
  // identities once; every test still gets its own stokvel and payout state.
  beforeAll(async () => {
    sharedUsers = {
      organizer: await freshUser("Organizer"),
      recipient: await freshUser("Recipient"),
      second: await freshUser("Second"),
      outsider: await freshUser("Outsider"),
    };
  }, 60_000);

  async function freshGroup() {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { organizer, recipient, second, outsider } = sharedUsers;

    const created = await createStokvel(organizer.client, {
      name: `Payout Group ${crypto.randomUUID().slice(0, 8)}`,
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    if (!created.ok) throw new Error(`createStokvel failed: ${created.message}`);
    createdStokvelIds.push(created.data.id);

    // Explicit, increasing join times make the default (join-order) rotation
    // deterministic; the organizer-set order below deliberately reverses it.
    const now = Date.now();
    const added = await adminClient().from("stokvel_members").insert([
      {
        stokvel_id: created.data.id,
        user_id: recipient.id,
        role: "member",
        joined_at: new Date(now + DAY_MS).toISOString(),
      },
      {
        stokvel_id: created.data.id,
        user_id: second.id,
        role: "member",
        joined_at: new Date(now + 2 * DAY_MS).toISOString(),
      },
    ]);
    expect(added.error).toBeNull();

    const roster = await listMembers(organizer.client, created.data.id);
    if (!roster.ok) throw new Error(`listMembers failed: ${roster.message}`);
    const memberFor = (userId: string) => {
      const member = roster.data.find((m) => m.userId === userId);
      if (!member) throw new Error(`roster missing user ${userId}`);
      return member;
    };

    return {
      stokvelId: created.data.id,
      organizer,
      recipient,
      second,
      outsider,
      organizerMemberId: memberFor(organizer.id).id,
      recipientMemberId: memberFor(recipient.id).id,
      secondMemberId: memberFor(second.id).id,
      joinOrder: roster.data.map((m) => m.id),
    };
  }

  async function scheduleOkay(
    client: SupabaseClient,
    input: SchedulePayoutInput,
  ): Promise<string> {
    const result = await schedulePayout(client, input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`schedulePayout failed: ${result.message}`);
    return result.data.id;
  }

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      // Cascades payouts, members and notifications; audit rows are retained
      // and anonymised by migration 0008.
      await admin.from("stokvels").delete().eq("id", id);
    }
    for (const email of createdEmails) await cleanupUser(email);
  }, 60_000);

  it("T-US10-1 / OP18 organizer schedules a payout with one audit row and the exact due notification", async () => {
    const group = await freshGroup();
    const scheduledDate = futureDate(2);

    const result = await schedulePayout(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.recipientMemberId,
      amount: 3750,
      scheduledDate,
      note: "First rotation payout",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.data.id).toBe("string");
    expect(result.data.id.length).toBeGreaterThan(0);

    const admin = adminClient();
    const { data: rows } = await admin
      .from("payouts")
      .select("id, stokvel_id, member_id, amount, scheduled_date, status, paid_at, note, recorded_by")
      .eq("id", result.data.id);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({
      stokvel_id: group.stokvelId,
      member_id: group.recipientMemberId,
      amount: 3750,
      scheduled_date: scheduledDate,
      status: "scheduled",
      note: "First rotation payout",
      recorded_by: group.organizer.id,
    });
    expect(rows?.[0].paid_at).toBeNull();

    const { data: auditRows } = await admin
      .from("audit_log")
      .select("id, entity_type, action, entity_id")
      .eq("entity_type", "payout")
      .eq("entity_id", result.data.id);
    expect(auditRows).toHaveLength(1);
    expect(auditRows?.[0].action).toBe(AUDIT_ACTIONS.scheduled);

    // PRD §4.5: organizer AND recipient receive the exact "Payout due" text.
    const expected = payoutDueCopy(group.recipient.fullName, scheduledDate);
    const { data: notifications } = await admin
      .from("notifications")
      .select("id, user_id, stokvel_id, message, screen")
      .eq("stokvel_id", group.stokvelId)
      .eq("message", expected);
    expect(notifications).toHaveLength(2);
    expect(notifications?.map((n) => n.user_id).sort()).toEqual(
      [group.organizer.id, group.recipient.id].sort(),
    );
    expect(notifications?.every((n) => n.screen === "S9")).toBe(true);
  });

  it("T-US10-2 / OP19 marking paid sets paid_at, status and exactly one audit row", async () => {
    const group = await freshGroup();
    const payoutId = await scheduleOkay(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.recipientMemberId,
      amount: 250,
      scheduledDate: futureDate(1),
    });

    const paidAt = new Date().toISOString();
    const result = await markPayoutPaid(group.organizer.client, {
      stokvelId: group.stokvelId,
      payoutId,
      paidAt,
      note: "Paid in cash",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe(payoutId);

    const admin = adminClient();
    const { data: rows } = await admin
      .from("payouts")
      .select("id, status, paid_at, note")
      .eq("id", payoutId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].status).toBe("paid");
    expect(rows?.[0].note).toBe("Paid in cash");
    expect(new Date(rows?.[0].paid_at ?? "").getTime()).toBe(
      new Date(paidAt).getTime(),
    );

    const { data: auditRows } = await admin
      .from("audit_log")
      .select("id, entity_type, action, entity_id")
      .eq("entity_type", "payout")
      .eq("entity_id", payoutId)
      .eq("action", AUDIT_ACTIONS.paid);
    expect(auditRows).toHaveLength(1);
  });

  it("T-BR11-1 organizer-set rotation order overrides join order for the next recipient", async () => {
    const group = await freshGroup();

    // Baseline: an untouched group follows join order (organizer, recipient, second).
    const initial = await getPayouts(group.organizer.client, group.stokvelId);
    expect(initial.ok).toBe(true);
    if (!initial.ok) return;
    expect(initial.data.rotationOrder).toEqual(group.joinOrder);
    expect(initial.data.nextMemberId).toBe(group.joinOrder[0]);

    const override = [
      group.secondMemberId,
      group.recipientMemberId,
      group.organizerMemberId,
    ];
    const saved = await setRotationOrder(group.organizer.client, group.stokvelId, override);
    expect(saved.ok).toBe(true);

    const before = await getPayouts(group.organizer.client, group.stokvelId);
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    expect(before.data.rotationOrder).toEqual(override);
    expect(before.data.nextMemberId).toBe(group.secondMemberId);

    // Scheduling from the derived next recipient must use the organizer's
    // order, not the join-order-first member.
    const payoutId = await scheduleOkay(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: before.data.nextMemberId!,
      amount: 250,
      scheduledDate: futureDate(2),
    });
    const { data: rows } = await adminClient()
      .from("payouts")
      .select("id, member_id")
      .eq("id", payoutId);
    expect(rows?.[0].member_id).toBe(group.secondMemberId);

    const after = await getPayouts(group.organizer.client, group.stokvelId);
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.data.rows).toHaveLength(1);
    expect(after.data.rows[0]?.memberId).toBe(group.secondMemberId);
    expect(after.data.nextMemberId).toBe(group.recipientMemberId);
  });

  it("T-SEC-13a / 13b a stokvel member can read payouts, an outsider cannot", async () => {
    const group = await freshGroup();
    const payoutId = await scheduleOkay(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.recipientMemberId,
      amount: 250,
      scheduledDate: futureDate(2),
    });

    const memberView = await getPayouts(group.recipient.client, group.stokvelId);
    expect(memberView.ok).toBe(true);
    if (memberView.ok) {
      expect(memberView.data.rows.map((row) => row.id)).toContain(payoutId);
    }

    const outsiderView = await getPayouts(group.outsider.client, group.stokvelId);
    expect(outsiderView).toEqual({ ok: false, message: MESSAGES.couldNotLoad });
  });

  it("T-SEC-14a / 14b organizer can write payouts, a plain member cannot", async () => {
    const group = await freshGroup();
    const input: SchedulePayoutInput = {
      stokvelId: group.stokvelId,
      memberId: group.recipientMemberId,
      amount: 250,
      scheduledDate: futureDate(2),
    };

    const denied = await schedulePayout(group.recipient.client, input);
    expect(denied).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });
    const { data: rowsAfterDenial } = await adminClient()
      .from("payouts")
      .select("id")
      .eq("stokvel_id", group.stokvelId);
    expect(rowsAfterDenial).toEqual([]);

    const payoutId = await scheduleOkay(group.organizer.client, input);
    const deniedPaid = await markPayoutPaid(group.recipient.client, {
      stokvelId: group.stokvelId,
      payoutId,
      paidAt: new Date().toISOString(),
    });
    expect(deniedPaid).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });

    const { data: rows } = await adminClient()
      .from("payouts")
      .select("status, paid_at")
      .eq("id", payoutId);
    expect(rows?.[0].status).toBe("scheduled");
    expect(rows?.[0].paid_at).toBeNull();
  });

  it("T-NOTIF-1 / OP24 getNotifications returns only the caller's notifications with exact copy", async () => {
    const group = await freshGroup();
    const scheduledDate = futureDate(2);
    await scheduleOkay(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.recipientMemberId,
      amount: 250,
      scheduledDate,
    });
    const expected = payoutDueCopy(group.recipient.fullName, scheduledDate);

    // A second, caller-specific notification must not leak to the organizer
    // or recipient. Put it in a stokvel the outsider actually belongs to.
    const outsiderGroup = await createStokvel(group.outsider.client, {
      name: `Outsider Group ${crypto.randomUUID().slice(0, 8)}`,
      contributionAmount: 100,
      contributionFrequency: "monthly",
    });
    if (!outsiderGroup.ok) throw new Error(`createStokvel failed: ${outsiderGroup.message}`);
    createdStokvelIds.push(outsiderGroup.data.id);

    const outsiderOnly = "Outsider-only notification";
    const inserted = await adminClient().from("notifications").insert({
      user_id: group.outsider.id,
      stokvel_id: outsiderGroup.data.id,
      message: outsiderOnly,
      screen: "S9",
    });
    expect(inserted.error).toBeNull();

    const organizerNotifications = await getNotifications(group.organizer.client);
    expect(organizerNotifications.ok).toBe(true);
    if (organizerNotifications.ok) {
      expect(organizerNotifications.data.map((n) => n.message)).toContain(expected);
      expect(organizerNotifications.data.every((n) => n.userId === group.organizer.id)).toBe(true);
      expect(organizerNotifications.data.map((n) => n.message)).not.toContain(outsiderOnly);
      expect(organizerNotifications.data[0]).toMatchObject({
        userId: group.organizer.id,
        stokvelId: group.stokvelId,
        screen: "S9",
      });
    }

    const recipientNotifications = await getNotifications(group.recipient.client);
    expect(recipientNotifications.ok).toBe(true);
    if (recipientNotifications.ok) {
      expect(recipientNotifications.data.map((n) => n.message)).toContain(expected);
      expect(recipientNotifications.data.every((n) => n.userId === group.recipient.id)).toBe(true);
      expect(recipientNotifications.data.map((n) => n.message)).not.toContain(outsiderOnly);
    }

    const outsiderNotifications = await getNotifications(group.outsider.client);
    expect(outsiderNotifications.ok).toBe(true);
    if (outsiderNotifications.ok) {
      expect(outsiderNotifications.data.map((n) => n.message)).toContain(outsiderOnly);
      expect(outsiderNotifications.data.every((n) => n.userId === group.outsider.id)).toBe(true);
      expect(outsiderNotifications.data.map((n) => n.message)).not.toContain(expected);
    }
  });

  it("T-BR5-1 API rejects out-of-range payouts with the exact DB copy and writes nothing", async () => {
    const group = await freshGroup();
    for (const [amount, message] of [
      [0, PAYOUT_AMOUNT_COPY],
      [10_000_000.01, PAYOUT_AMOUNT_COPY],
    ] as const) {
      const result = await schedulePayout(group.organizer.client, {
        stokvelId: group.stokvelId,
        memberId: group.recipientMemberId,
        amount,
        scheduledDate: futureDate(2),
      });
      expect(result).toEqual({ ok: false, message });
    }

    const { data: rows } = await adminClient()
      .from("payouts")
      .select("id")
      .eq("stokvel_id", group.stokvelId);
    expect(rows).toEqual([]);

    // Boundaries accepted by the DB trigger must also be accepted by the API.
    expect(validatePayoutAmount(0.01)).toEqual({ ok: true, data: true });
    expect(validatePayoutAmount(10_000_000)).toEqual({ ok: true, data: true });
  });
});

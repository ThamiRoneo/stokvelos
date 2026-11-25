import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDisputes, raiseDispute, resolveDispute } from "@/lib/api/disputes";
import { getNotifications } from "@/lib/api/notifications";
import { createStokvel, listMembers } from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";
import { adminClient, cleanupUser, seedPassword, signInAs } from "./helpers";

/** Exact PRD §4.5 / OP20–OP21 copy, asserted literally as well as via MESSAGES. */
const COPY = {
  outsiderRaise: "Only members can raise a dispute.",
  organizerOnly: "Only the organizer can do this.",
  disputeRaised: (stokvel: string) => `New dispute raised in ${stokvel}.`,
  disputeResolved: (stokvel: string) =>
    `Your dispute in ${stokvel} was resolved.`,
} as const;

const AUDIT_ACTION_RESOLVED = "Dispute resolved";

type RaiseDisputeInput = Parameters<typeof raiseDispute>[1];
type ResolveDisputeInput = Parameters<typeof resolveDispute>[1];

type TestUser = {
  email: string;
  id: string;
  fullName: string;
  client: SupabaseClient;
};

describe("Phase 5 disputes integration", () => {
  const createdStokvelIds: string[] = [];
  const createdEmails: string[] = [];
  let sharedUsers: {
    organizer: TestUser;
    raiser: TestUser;
    outsider: TestUser;
  } | null = null;

  /** Disposable auth users only — seeded identities are never mutated. */
  async function freshUser(label: string): Promise<TestUser> {
    const email = `dispute-${label}-${crypto.randomUUID()}@stokvelos.app`;
    const fullName = `Dispute ${label}`;
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

  // Creating auth users is the slow part; share three identities across the
  // suite while giving every test its own stokvel and dispute state.
  beforeAll(async () => {
    sharedUsers = {
      organizer: await freshUser("Organizer"),
      raiser: await freshUser("Raiser"),
      outsider: await freshUser("Outsider"),
    };
  }, 60_000);

  async function freshGroup() {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { organizer, raiser, outsider } = sharedUsers;
    const stokvelName = `Dispute Group ${crypto.randomUUID().slice(0, 8)}`;

    const created = await createStokvel(organizer.client, {
      name: stokvelName,
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    if (!created.ok) throw new Error(`createStokvel failed: ${created.message}`);
    createdStokvelIds.push(created.data.id);

    const added = await adminClient().from("stokvel_members").insert({
      stokvel_id: created.data.id,
      user_id: raiser.id,
      role: "member",
    });
    expect(added.error).toBeNull();

    const roster = await listMembers(organizer.client, created.data.id);
    if (!roster.ok) throw new Error(`listMembers failed: ${roster.message}`);
    const raiserRow = roster.data.find((row) => row.userId === raiser.id);
    if (!raiserRow) throw new Error("roster missing the raising member");

    return {
      stokvelId: created.data.id,
      stokvelName,
      organizer,
      raiser,
      outsider,
      raiserMemberId: raiserRow.id,
    };
  }

  async function raiseOkay(
    client: SupabaseClient,
    input: RaiseDisputeInput,
  ): Promise<string> {
    const result = await raiseDispute(client, input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`raiseDispute failed: ${result.message}`);
    return result.data.id;
  }

  async function messagesFor(client: SupabaseClient): Promise<string[]> {
    const result = await getNotifications(client);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`getNotifications failed: ${result.message}`);
    return result.data.map((notification) => notification.message);
  }

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      await admin.from("stokvels").delete().eq("id", id);
    }
    for (const email of createdEmails) await cleanupUser(email);
  }, 60_000);

  it("T-US12-1 / OP20 / T-SEC-16a a member raises an open dispute and the organizer gets the exact §4.5 copy", async () => {
    const group = await freshGroup();
    const input: RaiseDisputeInput = {
      stokvelId: group.stokvelId,
      subjectType: "contribution",
      description: "My contribution is missing from the ledger.",
    };

    const result = await raiseDispute(group.raiser.client, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.data.id).toBe("string");
    expect(result.data.id.length).toBeGreaterThan(0);

    const { data: rows } = await adminClient()
      .from("disputes")
      .select("id, stokvel_id, raised_by, subject_type, description, status, resolved_by, resolved_at, resolution_note")
      .eq("id", result.data.id);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({
      stokvel_id: group.stokvelId,
      raised_by: group.raiser.id,
      subject_type: "contribution",
      description: input.description,
      status: "open",
    });
    expect(rows?.[0].resolved_by).toBeNull();
    expect(rows?.[0].resolved_at).toBeNull();
    expect(rows?.[0].resolution_note).toBeNull();

    const listed = await getDisputes(group.raiser.client, group.stokvelId);
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.map((dispute) => dispute.id)).toContain(result.data.id);
    }

    const expected = COPY.disputeRaised(group.stokvelName);
    expect(await messagesFor(group.organizer.client)).toContain(expected);
    expect(await messagesFor(group.raiser.client)).not.toContain(expected);
    expect(await messagesFor(group.outsider.client)).not.toContain(expected);
  });

  it("T-US13-1 / OP21 / T-SEC-17a organizer resolves it with one audit row and the exact §4.5 copy", async () => {
    const group = await freshGroup();
    const disputeId = await raiseOkay(group.raiser.client, {
      stokvelId: group.stokvelId,
      subjectType: "stokvel",
      description: "Please confirm the rotation order.",
    });
    const input: ResolveDisputeInput = {
      stokvelId: group.stokvelId,
      disputeId,
      resolutionNote: "Confirmed against the rotation list.",
    };

    const result = await resolveDispute(group.organizer.client, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe(disputeId);

    const { data: rows } = await adminClient()
      .from("disputes")
      .select("id, status, resolved_by, resolved_at, resolution_note")
      .eq("id", disputeId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({
      status: "resolved",
      resolved_by: group.organizer.id,
      resolution_note: input.resolutionNote,
    });
    expect(Number.isFinite(Date.parse(rows?.[0].resolved_at ?? ""))).toBe(true);

    const { data: auditRows } = await adminClient()
      .from("audit_log")
      .select("id, action, entity_type")
      .eq("entity_type", "dispute")
      .eq("entity_id", disputeId)
      .eq("action", AUDIT_ACTION_RESOLVED);
    expect(auditRows).toHaveLength(1);

    const expected = COPY.disputeResolved(group.stokvelName);
    expect(await messagesFor(group.raiser.client)).toContain(expected);
    expect(await messagesFor(group.organizer.client)).not.toContain(expected);
  });

  it("T-BR3-1 / T-SEC-16b a non-member cannot raise a dispute", async () => {
    const group = await freshGroup();
    const result = await raiseDispute(group.outsider.client, {
      stokvelId: group.stokvelId,
      subjectType: "payout",
      description: "I do not belong to this group.",
    });
    expect(result).toEqual({
      ok: false,
      message: COPY.outsiderRaise,
    });
    expect(MESSAGES.onlyMembersDispute).toBe(COPY.outsiderRaise);

    const { data: rows } = await adminClient()
      .from("disputes")
      .select("id")
      .eq("stokvel_id", group.stokvelId);
    expect(rows).toEqual([]);
  });

  it("T-BR10-1 / T-SEC-17b a plain member cannot resolve a dispute", async () => {
    const group = await freshGroup();
    const disputeId = await raiseOkay(group.raiser.client, {
      stokvelId: group.stokvelId,
      subjectType: "stokvel",
      description: "Member-only resolution attempt fixture.",
    });

    const denied = await resolveDispute(group.raiser.client, {
      stokvelId: group.stokvelId,
      disputeId,
      resolutionNote: "Trying to resolve my own dispute.",
    });
    expect(denied).toEqual({ ok: false, message: COPY.organizerOnly });
    expect(MESSAGES.onlyOrganizer).toBe(COPY.organizerOnly);

    const { data: rows } = await adminClient()
      .from("disputes")
      .select("status, resolved_by, resolved_at, resolution_note")
      .eq("id", disputeId);
    expect(rows).toHaveLength(1);
    expect(rows?.[0].status).toBe("open");
    expect(rows?.[0].resolved_by).toBeNull();
    expect(rows?.[0].resolved_at).toBeNull();
    expect(rows?.[0].resolution_note).toBeNull();
  });

  it("T-SEC-15a / 15b members read disputes; an outsider is denied", async () => {
    const group = await freshGroup();
    const disputeId = await raiseOkay(group.raiser.client, {
      stokvelId: group.stokvelId,
      subjectType: "contribution",
      description: "Read-permission fixture.",
    });

    const memberView = await getDisputes(group.raiser.client, group.stokvelId);
    expect(memberView.ok).toBe(true);
    if (memberView.ok) {
      expect(memberView.data.map((dispute) => dispute.id)).toContain(disputeId);
    }

    const organizerView = await getDisputes(
      group.organizer.client,
      group.stokvelId,
    );
    expect(organizerView.ok).toBe(true);
    if (organizerView.ok) {
      expect(organizerView.data.map((dispute) => dispute.id)).toContain(disputeId);
    }

    const outsiderView = await getDisputes(
      group.outsider.client,
      group.stokvelId,
    );
    expect(outsiderView).toEqual({
      ok: false,
      message: MESSAGES.couldNotLoad,
    });
  });
});

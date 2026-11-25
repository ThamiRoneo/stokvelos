import { afterAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, IDS, signInAs } from "./helpers";
import {
  getLedger,
  getMemberStatement,
  recordContribution,
  type ContributionRecord,
  type LedgerData,
  type MemberStatement,
  type RecordContributionInput,
} from "@/lib/api/contributions";
import { createStokvel, listMembers } from "@/lib/api/stokvels";
import { MESSAGES } from "@/lib/messages";

/** PRD §10 copy for keys the backend adds in Phase 3, asserted literally. */
const COPY = {
  duplicateContribution: (name: string, period: string) =>
    `A contribution for ${name} for ${period} already exists. Edit instead?`,
} as const;

const NOMSA = "nomsa@stokvelos.app";
const SIPHO = "sipho@stokvelos.app";
const THANDI = "thandi@stokvelos.app";

describe("Phase 3 contributions integration", () => {
  const createdStokvelIds: string[] = [];

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      // Cascades contributions and members; audit rows are immutable and
      // retained/anonymised by migration 0008.
      await admin.from("stokvels").delete().eq("id", id);
    }
  });

  async function freshGroup(name: string) {
    const organizer = await signInAs(NOMSA);
    const created = await createStokvel(organizer, {
      name,
      contributionAmount: 250,
      contributionFrequency: "weekly",
    });
    if (!created.ok) throw new Error(`createStokvel failed: ${created.message}`);
    createdStokvelIds.push(created.data.id);

    const added = await adminClient().from("stokvel_members").insert({
      stokvel_id: created.data.id,
      user_id: IDS.sipho,
      role: "member",
    });
    expect(added.error).toBeNull();

    const roster = await listMembers(organizer, created.data.id);
    if (!roster.ok) throw new Error(`listMembers failed: ${roster.message}`);
    const organizerMember = roster.data.find((m) => m.userId === IDS.nomsa);
    const member = roster.data.find((m) => m.userId === IDS.sipho);
    if (!organizerMember || !member) throw new Error("roster missing expected members");

    return {
      stokvelId: created.data.id,
      organizer,
      organizerMemberId: organizerMember.id,
      organizerName: organizerMember.fullName,
      memberId: member.id,
      memberName: member.fullName,
    };
  }

  async function recordOkay(
    client: Parameters<typeof recordContribution>[0],
    input: RecordContributionInput,
  ) {
    const result = await recordContribution(client, input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(`recordContribution failed: ${result.message}`);
    return result.data;
  }

  it("T-US7-1 organizer records a contribution and writes exactly one audit row (OP16/BR9)", async () => {
    const group = await freshGroup("Record One Group");
    const input: RecordContributionInput = {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W47",
      note: "Weekly contribution",
    };

    const result = await recordContribution(group.organizer, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(typeof result.data.id).toBe("string");
    expect(result.data.id.length).toBeGreaterThan(0);

    const admin = adminClient();
    const { data: rows } = await admin
      .from("contributions")
      .select("id, stokvel_id, member_id, amount, period_label, note, recorded_by")
      .eq("id", result.data.id);
    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({
      stokvel_id: group.stokvelId,
      member_id: group.memberId,
      amount: 250,
      period_label: "2026-W47",
      note: "Weekly contribution",
      recorded_by: IDS.nomsa,
    });

    const { data: auditRows } = await admin
      .from("audit_log")
      .select("id, entity_type, action, entity_id")
      .eq("entity_type", "contribution")
      .eq("action", "Contribution recorded")
      .eq("entity_id", result.data.id);
    expect(auditRows).toHaveLength(1);
  });

  it("T-US8-1 ledger and own statement return rows, totals, periods and roster (S8)", async () => {
    const group = await freshGroup("Ledger Read Group");
    const first = await recordOkay(group.organizer, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W47",
      note: "Week 47",
    });
    await recordOkay(group.organizer, {
      stokvelId: group.stokvelId,
      memberId: group.organizerMemberId,
      amount: 300,
      periodLabel: "2026-W47",
    });
    await recordOkay(group.organizer, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 125.5,
      periodLabel: "2026-W48",
    });

    const ledger = await getLedger(group.organizer, group.stokvelId);
    expect(ledger.ok).toBe(true);
    if (!ledger.ok) return;
    const data: LedgerData = ledger.data;
    expect(data.rows).toHaveLength(3);
    expect(data.totals.total).toBe(675.5);
    expect(data.periods).toEqual(["2026-W47", "2026-W48"]);
    expect(data.members).toHaveLength(2);
    expect(data.members).toEqual(
      expect.arrayContaining([
        { id: group.memberId, name: group.memberName },
        { id: group.organizerMemberId, name: group.organizerName },
      ]),
    );

    const firstRow: ContributionRecord | undefined = data.rows.find(
      (row: ContributionRecord) => row.id === first.id,
    );
    expect(firstRow).toMatchObject({
      id: first.id,
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      memberName: group.memberName,
      amount: 250,
      periodLabel: "2026-W47",
      note: "Week 47",
    });
    expect(typeof firstRow?.recordedAt).toBe("string");
    expect(
      data.rows.reduce(
        (sum: number, row: ContributionRecord) => sum + row.amount,
        0,
      ),
    ).toBe(data.totals.total);

    const memberLedger = await getLedger(
      group.organizer,
      group.stokvelId,
      group.memberId,
    );
    expect(memberLedger.ok).toBe(true);
    if (memberLedger.ok) {
      expect(memberLedger.data.rows).toHaveLength(2);
      expect(
        memberLedger.data.rows.every(
          (row: ContributionRecord) => row.memberId === group.memberId,
        ),
      ).toBe(true);
      expect(memberLedger.data.totals.total).toBe(375.5);
    }

    const memberClient = await signInAs(SIPHO);
    const statement = await getMemberStatement(memberClient, group.stokvelId);
    expect(statement.ok).toBe(true);
    if (!statement.ok) return;
    const own: MemberStatement = statement.data;
    expect(own).toMatchObject({
      memberId: group.memberId,
      memberName: group.memberName,
      total: 375.5,
    });
    expect(own.rows).toHaveLength(2);
    expect(
      own.rows.every((row: ContributionRecord) => row.memberId === group.memberId),
    ).toBe(true);
    expect(
      own.rows.reduce(
        (sum: number, row: ContributionRecord) => sum + row.amount,
        0,
      ),
    ).toBe(own.total);
  });

  it("T-EDGE-1 duplicate member/period returns the exact PRD copy (BR4)", async () => {
    const group = await freshGroup("Duplicate Period Group");
    const input: RecordContributionInput = {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W47",
    };
    await recordOkay(group.organizer, input);

    const duplicate = await recordContribution(group.organizer, input);
    expect(duplicate).toEqual({
      ok: false,
      message: COPY.duplicateContribution(group.memberName, "2026-W47"),
    });

    const { data: rows } = await adminClient()
      .from("contributions")
      .select("id")
      .eq("stokvel_id", group.stokvelId)
      .eq("member_id", group.memberId)
      .eq("period_label", "2026-W47");
    expect(rows).toHaveLength(1);
  });

  it.each([0, 1_000_000.01])(
    "T-BR4-1 API rejects R%s with the exact range copy and writes nothing",
    async (amount) => {
      const group = await freshGroup(`Boundary ${amount}`);
      const result = await recordContribution(group.organizer, {
        stokvelId: group.stokvelId,
        memberId: group.memberId,
        amount,
        periodLabel: "2026-W47",
      });
      expect(result).toEqual({ ok: false, message: MESSAGES.amountRange });

      const { data: rows } = await adminClient()
        .from("contributions")
        .select("id")
        .eq("stokvel_id", group.stokvelId);
      expect(rows).toEqual([]);
    },
  );

  it("T-SEC-12b a plain member cannot record a contribution (SEC12)", async () => {
    const group = await freshGroup("Member Denied Group");
    const memberClient = await signInAs(SIPHO);
    const result = await recordContribution(memberClient, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W47",
    });
    expect(result).toEqual({ ok: false, message: MESSAGES.onlyOrganizer });

    const { data: rows } = await adminClient()
      .from("contributions")
      .select("id")
      .eq("stokvel_id", group.stokvelId);
    expect(rows).toEqual([]);
  });

  it("T-AUTH-3 an unauthenticated caller gets the session copy (SEC)", async () => {
    const group = await freshGroup("Logged Out Group");
    const result = await recordContribution(anonClient(), {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250,
      periodLabel: "2026-W47",
    });
    expect(result).toEqual({ ok: false, message: MESSAGES.pleaseLoginAgain });

    const { data: rows } = await adminClient()
      .from("contributions")
      .select("id")
      .eq("stokvel_id", group.stokvelId);
    expect(rows).toEqual([]);
  });

  it("T-SEC-11b a user outside the stokvel cannot read its ledger (SEC11)", async () => {
    const group = await freshGroup("Outsider Denied Group");
    const outsider = await signInAs(THANDI);
    const result = await getLedger(outsider, group.stokvelId);
    expect(result).toEqual({ ok: false, message: MESSAGES.couldNotLoad });
  });

  it("T-US8-1 an empty ledger returns ok with no rows and a zero total", async () => {
    const group = await freshGroup("Empty Ledger Group");
    // Empty-state copy ("No contributions yet. Record the first one.") is
    // frontend scope (Ledger component), not an API response.
    const result = await getLedger(group.organizer, group.stokvelId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.rows).toEqual([]);
    expect(result.data.totals.total).toBe(0);
    expect(result.data.periods).toEqual([]);
    expect(result.data.members.length).toBeGreaterThan(0);
  });
});

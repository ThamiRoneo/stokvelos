import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { recordContribution } from "@/lib/api/contributions";
import {
  buildLedgerCsv,
  buildLedgerPdf,
  getLedgerExport,
  type LedgerExportData,
} from "@/lib/api/export";
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

/**
 * Deterministic, hand-written CSV fixture. Every value that needs RFC-4180
 * escaping is spelled out literally below, so the assertion cannot be satisfied
 * by echoing the fixture through a shared helper.
 */
const CSV_FIXTURE: LedgerExportData = {
  stokvelName: 'Alpha, "Bravo"\nSavers',
  generatedAt: "2026-11-25T10:00:00.000Z",
  contributions: [
    {
      memberName: 'Nomsa, "N"',
      periodLabel: "2026-W01",
      amount: 250.5,
      note: 'Weekly, "checked"\nsecondary note',
      recordedAt: "2026-11-01T09:30:00.000Z",
    },
  ],
  payouts: [
    {
      memberName: 'Sipho "S"',
      amount: 3750,
      scheduledDate: "2026-12-05",
      status: "scheduled",
      paidAt: null,
      note: 'First, "rotation"\npayout',
    },
  ],
  totals: { contributions: 250.5, payouts: 3750 },
};

const EXPECTED_CSV_ROWS = [
  '"Stokvel","Alpha, ""Bravo""\nSavers"',
  '"Generated at","2026-11-25T10:00:00.000Z"',
  "",
  "Contributions",
  "Member,Period,Amount,Note,Recorded at",
  '"Nomsa, ""N""","2026-W01","R250.50","Weekly, ""checked""\nsecondary note","2026-11-01T09:30:00.000Z"',
  "",
  "Payouts",
  "Member,Amount,Scheduled date,Status,Paid at,Note",
  '"Sipho ""S""","R3750.00","2026-12-05","scheduled","","First, ""rotation""\npayout"',
  "",
  "Totals",
  '"Contributions","R250.50"',
  '"Payouts","R3750.00"',
];

/** CRLF and a trailing newline are both valid; row content is compared exactly. */
function normalizedCsv(csv: string): string {
  return csv.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

const PDF_FIXTURE: LedgerExportData = {
  stokvelName: "Phase Six Savers",
  generatedAt: "2026-11-25T10:00:00.000Z",
  contributions: [
    {
      memberName: "Nomsa Dlamini",
      periodLabel: "2026-W01",
      amount: 250.5,
      note: null,
      recordedAt: "2026-11-01T09:30:00.000Z",
    },
  ],
  payouts: [
    {
      memberName: "Sipho Nkosi",
      amount: 3750,
      scheduledDate: "2026-12-05",
      status: "scheduled",
      paidAt: null,
      note: null,
    },
  ],
  totals: { contributions: 250.5, payouts: 3750 },
};

describe("Phase 6 ledger export integration (T-US14-1 / OP23)", () => {
  const createdStokvelIds: string[] = [];
  const createdEmails: string[] = [];
  let sharedUsers: {
    organizer: TestUser;
    member: TestUser;
    otherOrganizer: TestUser;
    outsider: TestUser;
  } | null = null;

  /** Disposable auth users only — seeded identities are never mutated. */
  async function freshUser(label: string): Promise<TestUser> {
    const email = `export-${label}-${crypto.randomUUID()}@stokvelos.app`;
    const fullName = `Export ${label}`;
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
      organizer: await freshUser("Organizer"),
      member: await freshUser("Member"),
      otherOrganizer: await freshUser("OtherOrganizer"),
      outsider: await freshUser("Outsider"),
    };
  }, 60_000);

  async function freshGroup() {
    if (!sharedUsers) throw new Error("shared users not initialized");
    const { organizer, member, otherOrganizer, outsider } = sharedUsers;
    const stokvelName = `Export Group ${crypto.randomUUID().slice(0, 8)}`;

    const created = await createStokvel(organizer.client, {
      name: stokvelName,
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
    if (!memberRow) throw new Error("roster missing the exporting member");

    // A second group owned by a different organizer proves stokvel scoping.
    const otherGroup = await createStokvel(otherOrganizer.client, {
      name: `Other Export Group ${crypto.randomUUID().slice(0, 8)}`,
      contributionAmount: 100,
      contributionFrequency: "monthly",
    });
    if (!otherGroup.ok)
      throw new Error(`createStokvel failed: ${otherGroup.message}`);
    createdStokvelIds.push(otherGroup.data.id);

    return {
      stokvelId: created.data.id,
      stokvelName,
      otherStokvelId: otherGroup.data.id,
      organizer,
      member,
      otherOrganizer,
      outsider,
      memberId: memberRow.id,
    };
  }

  afterAll(async () => {
    const admin = adminClient();
    for (const id of createdStokvelIds) {
      await admin.from("stokvels").delete().eq("id", id);
    }
    for (const email of createdEmails) await cleanupUser(email);
  }, 60_000);

  it("getLedgerExport returns real ledger rows and totals for the organizer only", async () => {
    const group = await freshGroup();
    const scheduledDate = futureDate(10);

    const contribution = await recordContribution(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 250.5,
      periodLabel: "2026-W01",
      note: "Weekly check",
    });
    expect(contribution.ok).toBe(true);

    const payout = await schedulePayout(group.organizer.client, {
      stokvelId: group.stokvelId,
      memberId: group.memberId,
      amount: 3750,
      scheduledDate,
    });
    expect(payout.ok).toBe(true);

    const result = await getLedgerExport(group.organizer.client, group.stokvelId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.stokvelName).toBe(group.stokvelName);
    expect(Number.isFinite(Date.parse(result.data.generatedAt))).toBe(true);
    expect(result.data.contributions).toHaveLength(1);
    expect(result.data.contributions[0]).toMatchObject({
      memberName: group.member.fullName,
      periodLabel: "2026-W01",
      amount: 250.5,
      note: "Weekly check",
    });
    expect(Number.isFinite(Date.parse(result.data.contributions[0].recordedAt))).toBe(
      true,
    );

    expect(result.data.payouts).toHaveLength(1);
    expect(result.data.payouts[0]).toEqual({
      memberName: group.member.fullName,
      amount: 3750,
      scheduledDate,
      status: "scheduled",
      paidAt: null,
      note: null,
    });
    expect(result.data.totals).toEqual({ contributions: 250.5, payouts: 3750 });
  });

  it("getLedgerExport never fabricates rows for an empty stokvel", async () => {
    const group = await freshGroup();
    const result = await getLedgerExport(group.organizer.client, group.stokvelId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributions).toEqual([]);
    expect(result.data.payouts).toEqual([]);
    expect(result.data.totals).toEqual({ contributions: 0, payouts: 0 });
  });

  it("getLedgerExport denies a plain member, an outsider, an anonymous caller and another stokvel", async () => {
    const group = await freshGroup();
    const expected = { ok: false, message: MESSAGES.couldNotLoad };

    expect(await getLedgerExport(group.member.client, group.stokvelId)).toEqual(
      expected,
    );
    expect(await getLedgerExport(group.outsider.client, group.stokvelId)).toEqual(
      expected,
    );
    expect(await getLedgerExport(anonClient(), group.stokvelId)).toEqual(expected);
    expect(
      await getLedgerExport(group.organizer.client, group.otherStokvelId),
    ).toEqual(expected);
  });

  it("buildLedgerCsv emits deterministic, RFC-4180-escaped exact rows", () => {
    const csv = buildLedgerCsv(CSV_FIXTURE);

    expect(typeof csv).toBe("string");
    expect(normalizedCsv(csv)).toBe(EXPECTED_CSV_ROWS.join("\n"));
    // Same data and generatedAt must always produce the exact same bytes.
    expect(buildLedgerCsv(CSV_FIXTURE)).toBe(csv);
  });

  it("buildLedgerPdf creates a dependency-free PDF Blob with an uncompressed ledger stream", async () => {
    const pdf = buildLedgerPdf(PDF_FIXTURE);

    expect(pdf).toBeInstanceOf(Blob);
    expect(pdf.type).toBe("application/pdf");

    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const text = new TextDecoder().decode(bytes);
    expect(String.fromCharCode(...bytes.slice(0, 8))).toBe("%PDF-1.4");
    expect(text.replace(/\s+$/, "").endsWith("%%EOF")).toBe(true);

    const streams = text.match(/stream\r?\n[\s\S]*?endstream/g) ?? [];
    expect(streams.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/\/FlateDecode|\/Filter\s/);
    expect(streams.join("\n")).toContain("Phase Six Savers");
    expect(streams.join("\n")).toContain("Contributions");
    expect(streams.join("\n")).toContain("Payouts");
    expect(streams.join("\n")).toContain("R250.50");
    expect(streams.join("\n")).toContain("R3750.00");
  });
});

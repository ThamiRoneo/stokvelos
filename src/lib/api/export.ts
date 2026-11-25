import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES } from "@/lib/messages";
import { getLedger } from "./contributions";
import { getPayouts } from "./payouts";
import { getStokvel } from "./stokvels";
import { fail, ok, type Result } from "./types";

export type LedgerExportContribution = {
  memberName: string;
  periodLabel: string;
  amount: number;
  note: string | null;
  recordedAt: string;
};

export type LedgerExportPayout = {
  memberName: string;
  amount: number;
  scheduledDate: string;
  status: string;
  paidAt: string | null;
  note: string | null;
};

export type LedgerExportData = {
  stokvelName: string;
  generatedAt: string;
  contributions: LedgerExportContribution[];
  payouts: LedgerExportPayout[];
  totals: { contributions: number; payouts: number };
};

const NEUTRAL_MEMBER_NAME = "Member";
const CSV_EOL = "\r\n";

async function isOrganizer(
  client: SupabaseClient,
  stokvelId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from("stokvel_members")
    .select("id")
    .eq("stokvel_id", stokvelId)
    .eq("user_id", userId)
    .eq("role", "organizer")
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** OP23 — organizer-only, stokvel-scoped ledger snapshot for CSV/PDF export. */
export async function getLedgerExport(
  client: SupabaseClient,
  stokvelId: string,
): Promise<Result<LedgerExportData>> {
  const { data: userData } = await client.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fail(MESSAGES.couldNotLoad);
  if (!(await isOrganizer(client, stokvelId, userId)))
    return fail(MESSAGES.couldNotLoad);

  // Each helper enforces the same RLS scope; no rows are synthesised here.
  const [stokvel, ledger, payouts] = await Promise.all([
    getStokvel(client, stokvelId),
    getLedger(client, stokvelId),
    getPayouts(client, stokvelId),
  ]);
  if (!stokvel.ok || !ledger.ok || !payouts.ok)
    return fail(MESSAGES.couldNotLoad);

  // SEC1 hides other profiles from the organizer's client. The organizer-only
  // RPC resolves roster names under RLS-equivalent authorisation; the ledger
  // roster and "Member" remain the fallbacks.
  const { data: nameRows, error: nameError } = await client.rpc(
    "export_member_names",
    { p_stokvel_id: stokvelId },
  );
  if (nameError) return fail(MESSAGES.couldNotLoad);
  const names = new Map<string, string>();
  for (const row of (nameRows ?? []) as { member_id: string; full_name: string | null }[]) {
    if (row.full_name) names.set(row.member_id, row.full_name);
  }
  for (const member of ledger.data.members) {
    if (!names.has(member.id)) names.set(member.id, member.name);
  }
  const contributions = ledger.data.rows.map((row) => ({
    memberName: names.get(row.memberId) ?? NEUTRAL_MEMBER_NAME,
    periodLabel: row.periodLabel,
    amount: row.amount,
    note: row.note ?? null,
    recordedAt: row.recordedAt,
  }));
  const payoutRows = payouts.data.rows.map((row) => ({
    memberName: names.get(row.memberId) ?? NEUTRAL_MEMBER_NAME,
    amount: row.amount,
    scheduledDate: row.scheduledDate,
    status: row.status,
    paidAt: row.paidAt ?? null,
    note: row.note ?? null,
  }));

  return ok({
    stokvelName: stokvel.data.name,
    generatedAt: new Date().toISOString(),
    contributions,
    payouts: payoutRows,
    totals: {
      contributions: sum(contributions.map((row) => row.amount)),
      payouts: sum(payoutRows.map((row) => row.amount)),
    },
  });
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function money(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

/** OP23 — deterministic RFC-4180 CSV; no clock access inside the builder. */
export function buildLedgerCsv(data: LedgerExportData): string {
  const rows: string[] = [
    [csvCell("Stokvel"), csvCell(data.stokvelName)].join(","),
    [csvCell("Generated at"), csvCell(data.generatedAt)].join(","),
    "",
    "Contributions",
    "Member,Period,Amount,Note,Recorded at",
    ...data.contributions.map((row) =>
      [
        row.memberName,
        row.periodLabel,
        money(row.amount),
        row.note ?? "",
        row.recordedAt,
      ]
        .map(csvCell)
        .join(","),
    ),
    "",
    "Payouts",
    "Member,Amount,Scheduled date,Status,Paid at,Note",
    ...data.payouts.map((row) =>
      [
        row.memberName,
        money(row.amount),
        row.scheduledDate,
        row.status,
        row.paidAt ?? "",
        row.note ?? "",
      ]
        .map(csvCell)
        .join(","),
    ),
    "",
    "Totals",
    [csvCell("Contributions"), csvCell(money(data.totals.contributions))].join(","),
    [csvCell("Payouts"), csvCell(money(data.totals.payouts))].join(","),
  ];
  return `${rows.join(CSV_EOL)}${CSV_EOL}`;
}

/** PDF literal strings: ASCII-only keeps byte offsets exact; escape PDF syntax. */
function pdfString(value: string): string {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfLines(data: LedgerExportData): string[] {
  const lines: string[] = [
    `Stokvel: ${data.stokvelName}`,
    `Generated at: ${data.generatedAt}`,
    "",
    "Contributions",
  ];
  for (const row of data.contributions) {
    lines.push(`${row.memberName} | ${row.periodLabel} | ${money(row.amount)}`);
  }
  lines.push("", "Payouts");
  for (const row of data.payouts) {
    lines.push(
      `${row.memberName} | ${row.scheduledDate} | ${row.status} | ${money(row.amount)}`,
    );
  }
  lines.push(
    "",
    `Contributions total: ${money(data.totals.contributions)}`,
    `Payouts total: ${money(data.totals.payouts)}`,
  );
  return lines;
}

/** OP23 — minimal dependency-free PDF 1.4 writer with an uncompressed stream. */
export function buildLedgerPdf(data: LedgerExportData): Blob {
  const encoder = new TextEncoder();
  const stream: string[] = ["BT", "/F1 11 Tf", "14 TL", "48 794 Td"];
  for (const line of pdfLines(data)) {
    stream.push(`(${pdfString(line)}) Tj`, "T*");
  }
  stream.push("ET");
  const content = stream.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
      "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}

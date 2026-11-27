import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStokvel, listMembers } from "@/lib/api/stokvels";
import { getLedger } from "@/lib/api/contributions";
import { ContributionsLedger } from "@/components/screens/ContributionsLedger";
import { MESSAGES } from "@/lib/messages";

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/log-in");

  const [stokvelResult, membersResult, ledgerResult] = await Promise.all([
    getStokvel(supabase, id),
    listMembers(supabase, id),
    getLedger(supabase, id),
  ]);

  if (!stokvelResult.ok) redirect("/stokvels");

  const isOrganizer = membersResult.ok
    ? membersResult.data.some(
        (m) => m.userId === user.id && m.role === "organizer",
      )
    : false;

  let currentPeriod: string;
  if (ledgerResult.ok && ledgerResult.data.periods.length > 0) {
    currentPeriod = ledgerResult.data.periods[ledgerResult.data.periods.length - 1];
  } else {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7,
    );
    currentPeriod = `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  const emptyLedger = {
    rows: [],
    totals: { total: 0 },
    periods: [],
    members: [],
  };

  return (
    <ContributionsLedger
      stokvelId={id}
      ledger={ledgerResult.ok ? ledgerResult.data : emptyLedger}
      isOrganizer={isOrganizer}
      error={ledgerResult.ok ? undefined : MESSAGES.couldNotLoad}
    />
  );
}

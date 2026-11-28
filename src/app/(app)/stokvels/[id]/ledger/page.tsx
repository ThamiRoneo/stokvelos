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

  const ledgerForPage = ledgerResult.ok ? ledgerResult.data : emptyLedger;
  // cycleNumber = position of currentPeriod in the sorted period list (1-based)
  const cycleNumber = Math.max(
    1,
    ledgerForPage.periods.indexOf(currentPeriod) + 1,
  );
  // totalCycles = rotation order length from the stokvel (number of members in
  // the rotation); fall back to current member count so the chip still renders.
  const totalCycles =
    stokvelResult.data.rotationOrder.length > 0
      ? stokvelResult.data.rotationOrder.length
      : ledgerForPage.members.length || 1;

  return (
    <ContributionsLedger
      stokvelId={id}
      stokvelName={stokvelResult.data.name}
      cycleNumber={cycleNumber}
      totalCycles={totalCycles}
      ledger={ledgerForPage}
      isOrganizer={isOrganizer}
      error={ledgerResult.ok ? undefined : MESSAGES.couldNotLoad}
    />
  );
}

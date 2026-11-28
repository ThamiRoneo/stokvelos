import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStokvel, listMembers } from "@/lib/api/stokvels";
import { StokvelHome } from "@/components/screens/StokvelHome";
import { MESSAGES } from "@/lib/messages";

export default async function StokvelHomePage({
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

  const stokvelResult = await getStokvel(supabase, id);
  if (!stokvelResult.ok) redirect("/stokvels");

  const membersResult = await listMembers(supabase, id);
  const memberCount = membersResult.ok ? membersResult.data.length : 0;
  const isOrganizer = membersResult.ok
    ? membersResult.data.some((m) => m.userId === user.id && m.role === "organizer")
    : false;

  return (
    <StokvelHome
      stokvelId={id}
      stokvelName={stokvelResult.data.name}
      memberCount={memberCount}
      contributionAmount={stokvelResult.data.contributionAmount}
      frequency={stokvelResult.data.contributionFrequency}
      isOrganizer={isOrganizer}
      error={membersResult.ok ? undefined : MESSAGES.couldNotLoad}
    />
  );
}

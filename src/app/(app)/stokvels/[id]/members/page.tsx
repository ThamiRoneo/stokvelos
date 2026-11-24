"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Members } from "@/components/screens/Members";
import { InviteMember } from "@/components/modals/InviteMember";
import { RemoveMember } from "@/components/modals/RemoveMember";
import { createClient } from "@/lib/supabase/client";
import { listMembers, removeMember } from "@/lib/api/stokvels";
import { createInvite } from "@/lib/api/invites";
import type { Member } from "@/lib/api/types";
import { MESSAGES } from "@/lib/messages";

export default function MembersPage() {
  const params = useParams<{ id: string }>();
  const stokvelId = params.id;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [userId, setUserId] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  const load = useCallback(async () => {
    const client = createClient();
    const [{ data }, memberResult] = await Promise.all([
      client.auth.getUser(),
      listMembers(client, stokvelId),
    ]);
    setUserId(data.user?.id);
    if (memberResult.ok) setMembers(memberResult.data);
    else setError(memberResult.message);
    setLoading(false);
  }, [stokvelId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canOrganize = members.some((m) => m.userId === userId && m.role === "organizer");

  return (
    <>
      <Members
        stokvelId={stokvelId}
        members={members}
        canOrganize={canOrganize}
        loading={loading}
        error={error}
        offline={offline}
        successBanner={success}
        onInvite={async () => {
          setError(undefined);
          const result = await createInvite(createClient(), {
            stokvelId,
            origin: window.location.origin,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setInviteLink(result.data.link);
          setInviteOpen(true);
        }}
        onRemove={(member) => setRemoveTarget(member)}
      />
      <InviteMember open={inviteOpen} link={inviteLink} onClose={() => setInviteOpen(false)} />
      <RemoveMember
        open={Boolean(removeTarget)}
        memberName={removeTarget?.fullName ?? ""}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={async () => {
          if (!removeTarget) return;
          const result = await removeMember(createClient(), removeTarget.id);
          if (!result.ok) {
            setError(result.message);
            setRemoveTarget(null);
            return;
          }
          setSuccess(MESSAGES.memberRemoved);
          setRemoveTarget(null);
          setLoading(true);
          await load();
        }}
      />
    </>
  );
}

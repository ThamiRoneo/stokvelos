"use client";

import { Users } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { MemberRow } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import { isStale, staleMessage } from "@/lib/staleness";
import type { Member } from "@/lib/api/types";

/** S10 — Members (Stitch S10). Organizer-only actions are hidden for members. */
export function Members({
  stokvelId,
  members,
  canOrganize = false,
  loading = false,
  error,
  cachedAt,
  offline = false,
  successBanner,
  onInvite,
  onRemove,
}: {
  stokvelId?: string;
  members: Member[];
  canOrganize?: boolean;
  loading?: boolean;
  error?: string;
  cachedAt?: string;
  offline?: boolean;
  successBanner?: string;
  onInvite: () => void;
  onRemove: (member: Member) => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <TopAppBar
        title="Members"
        action={canOrganize ? <Button onClick={onInvite}>Invite</Button> : undefined}
      />
      <main className="flex-1 space-y-3 p-4">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {successBanner && <Banner variant="success">{successBanner}</Banner>}
        {cachedAt && isStale(cachedAt) && (
          <Banner variant="staleness">{staleMessage(cachedAt)}</Banner>
        )}

        {loading ? (
          <div className="flex justify-center py-12" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden="true" size={32} className="text-text-secondary" />}
            message={MESSAGES.noMembers}
          />
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id}>
                <MemberRow member={member} canRemove={canOrganize} onRemove={onRemove} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav active="Profile" stokvelId={stokvelId} />
    </div>
  );
}

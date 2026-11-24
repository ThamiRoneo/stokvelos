"use client";

import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { StokvelCard } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import type { InvitePreview } from "@/lib/api/types";

/** S6 — Join via Invite; the preview is an RPC with no member-level data. */
export function JoinViaInvite({
  preview,
  loading = false,
  error,
  offline = false,
  onJoin,
  onBack,
}: {
  preview?: InvitePreview;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  onJoin: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <TopAppBar title="Join via Invite" onBack={onBack} />
        <main className="flex-1 space-y-3 p-4">
          {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
          {error && <Banner variant="error">{error}</Banner>}

          {loading ? (
            <div className="flex justify-center py-12" aria-label="Loading">
              <Spinner size="lg" />
            </div>
          ) : preview ? (
            <>
              <StokvelCard
                stokvel={{
                  id: preview.stokvelId,
                  name: preview.name,
                  description: preview.description,
                  contributionAmount: preview.contributionAmount,
                  contributionFrequency: preview.contributionFrequency,
                  rotationOrder: [],
                  createdAt: "",
                }}
                memberCount={preview.memberCount}
              />
              <Button className="w-full" disabled={offline} onClick={onJoin}>
                Join
              </Button>
            </>
          ) : (
            !error && <p className="text-sm text-text-secondary">{MESSAGES.couldNotLoad}</p>
          )}
        </main>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

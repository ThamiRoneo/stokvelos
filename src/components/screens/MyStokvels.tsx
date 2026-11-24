"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { StokvelCard } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import { isStale, staleMessage } from "@/lib/staleness";
import type { Stokvel } from "@/lib/api/types";

/** S4 — My Stokvels. */
export function MyStokvels({
  stokvels,
  memberCounts = {},
  loading = false,
  error,
  cachedAt,
  offline = false,
}: {
  stokvels: Stokvel[];
  memberCounts?: Record<string, number>;
  loading?: boolean;
  error?: string;
  cachedAt?: string;
  offline?: boolean;
}) {
  const showStaleness = Boolean(cachedAt && isStale(cachedAt));

  return (
    <div className="flex min-h-full flex-col">
      <TopAppBar title="My Stokvels" />
      <main className="flex-1 space-y-3 p-4">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {showStaleness && cachedAt && (
          <Banner variant="staleness">{staleMessage(cachedAt)}</Banner>
        )}

        {loading ? (
          <div className="flex justify-center py-12" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : stokvels.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" size={32} className="text-text-secondary" />}
            message={MESSAGES.emptyStokvels}
            actions={
              <>
                <Link
                  href="/stokvels/new"
                  className="inline-flex min-h-touch items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface"
                >
                  Create one
                </Link>
                <Link
                  href="/join"
                  className="inline-flex min-h-touch items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary"
                >
                  join with a link
                </Link>
              </>
            }
          />
        ) : (
          <ul className="space-y-3">
            {stokvels.map((stokvel) => (
              <li key={stokvel.id}>
                <StokvelCard stokvel={stokvel} memberCount={memberCounts[stokvel.id]} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav active="Home" />
    </div>
  );
}

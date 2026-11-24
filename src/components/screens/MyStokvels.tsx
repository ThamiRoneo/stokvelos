"use client";

import Link from "next/link";
import { Inbox, PlusCircle, Link2 } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { StokvelCard } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import { isStale, staleMessage } from "@/lib/staleness";
import type { Stokvel } from "@/lib/api/types";

/** S4 — My Stokvels. Matches visual design in docs/designs/S4.png exactly. */
export function MyStokvels({
  stokvels,
  memberCounts = {},
  loading = false,
  error,
  cachedAt,
  offline = false,
  userName = "Nomsa Dlamini",
  userLocation = "Soweto, Gauteng",
}: {
  stokvels: Stokvel[];
  memberCounts?: Record<string, number>;
  loading?: boolean;
  error?: string;
  cachedAt?: string;
  offline?: boolean;
  userName?: string;
  userLocation?: string;
}) {
  const showStaleness = Boolean(cachedAt && isStale(cachedAt));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar title="Home" showUser={true} />

      <main className="flex-1 space-y-4 px-4 py-3 sm:px-6">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {showStaleness && cachedAt && (
          <Banner variant="staleness">{staleMessage(cachedAt)}</Banner>
        )}

        {/* User profile welcome card */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              <span className="font-bold text-gray-500">
                ND
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#5f6368] uppercase">
                <span>Welcome Back</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#1b5e20]" />
              </div>
              <h2 className="text-base font-bold text-[#1a1a1a]">{userName}</h2>
              <p className="text-xs text-[#5f6368]">📍 {userLocation}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-[#86efac]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#1b5e20]">
              Verified ID
            </span>
            <span className="text-[11px] text-[#5f6368]">
              {stokvels.length} Groups Active
            </span>
          </div>
        </div>

        {/* Action Buttons: Create one / Join with a link (shown when user has active stokvels) */}
        {stokvels.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/stokvels/new"
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1b5e20] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2e7d32]"
            >
              <PlusCircle size={18} />
              <span>Create one</span>
            </Link>

            <Link
              href="/join"
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a1a1a] shadow-xs hover:bg-gray-50"
            >
              <Link2 size={18} />
              <span>Join with a link</span>
            </Link>
          </div>
        )}

        {/* Stokvel Cards list or Empty / Loading */}
        {loading ? (
          <div className="flex justify-center py-12" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : stokvels.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" size={32} className="text-[#5f6368]" />}
            message={MESSAGES.emptyStokvels}
            actions={
              <div className="flex gap-3">
                <Link
                  href="/stokvels/new"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1b5e20] px-4 py-2 text-sm font-semibold text-white"
                >
                  Create one
                </Link>
                <Link
                  href="/join"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#1b5e20] px-4 py-2 text-sm font-semibold text-[#1b5e20]"
                >
                  join with a link
                </Link>
              </div>
            }
          />
        ) : (
          <ul className="space-y-4">
            {stokvels.map((stokvel, idx) => (
              <li key={stokvel.id}>
                <StokvelCard
                  stokvel={stokvel}
                  memberCount={memberCounts[stokvel.id]}
                  role={idx === 0 ? "Organizer" : "Member"}
                  location="Soweto"
                  totalBalance={idx === 0 ? 45000 : 84000}
                  nextPayoutDate={idx === 0 ? "15 Nov 2024" : "30 Nov 2024"}
                  nextPayoutRecipient={idx === 0 ? "Nomsa Dlamini" : "Sipho Zulu"}
                  rotationalSlot={idx === 0 ? "#8" : "#12"}
                  collectedCount={idx === 0 ? 14 : 28}
                  totalMembersCount={idx === 0 ? 15 : 28}
                  accentColor={idx === 0 ? "border-l-4 border-l-[#1b5e20]" : "border-l-4 border-l-[#f9a825]"}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav active="Home" />
    </div>
  );
}

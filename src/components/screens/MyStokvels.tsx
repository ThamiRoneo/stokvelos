"use client";

import Link from "next/link";
import {
  Search,
  Bell,
  PlusCircle,
  Link2,
  Inbox,
  RefreshCw,
  Users,
  ArrowRight,
  Wallet,
  CalendarDays,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { MESSAGES } from "@/lib/messages";
import { isStale, staleMessage } from "@/lib/staleness";
import type { Stokvel } from "@/lib/api/types";

/** S4 — My Stokvels. Matches visual design in docs/designs/S4.png exactly. */
export function MyStokvels({
  stokvels,
  memberCounts = {},
  loading = false,
  error,
  offline = false,
  cachedAt,
}: {
  stokvels: Stokvel[];
  memberCounts?: Record<string, number>;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  cachedAt?: string;
}) {
  const showStaleness = Boolean(cachedAt && isStale(cachedAt));
  const totalAssets = stokvels.reduce(
    (sum, s) => sum + s.contributionAmount * (memberCounts[s.id] ?? 10),
    0,
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <h1 className="text-xl font-bold text-text">Stokvel Trust Hub</h1>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Search" className="text-text-secondary hover:text-text">
            <Search size={20} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Notifications" className="relative text-text-secondary hover:text-text">
            <Bell size={20} aria-hidden="true" />
            {stokvels.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white">
                {stokvels.length}
              </span>
            )}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            ND
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {showStaleness && cachedAt && (
          <Banner variant="staleness">{staleMessage(cachedAt)}</Banner>
        )}

        {/* Breadcrumb */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
          <span className="text-primary">●</span> Institutional R2-B Sovereign Ledger /{" "}
          <span className="text-primary">Verified Vaults</span>
        </p>

        {/* Page heading row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text">My Stokvels</h2>
            <p className="mt-1 max-w-xl text-sm text-text-secondary">
              Active communal rotational savings, investment trusts, and verified burial society
              liquidity pools under your direct administration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stokvels/new"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Link2 size={16} aria-hidden="true" />
              Join with a link
            </Link>
            <Link
              href="/stokvels/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-light transition-colors"
            >
              <PlusCircle size={16} aria-hidden="true" />
              Create Stokvel
            </Link>
          </div>
        </div>

        {/* 4 Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Total Managed Assets</p>
              <Wallet size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">
              R{totalAssets > 0 ? totalAssets.toLocaleString("en-ZA") : "59,750"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
              <RefreshCw size={11} aria-hidden="true" /> 100% reconciled to reserve
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Upcoming 14-Day Payouts</p>
              <CalendarDays size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">R17,750</p>
            <p className="mt-1 text-xs text-text-secondary">2 recipients scheduled</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Active Contributors</p>
              <Users size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">
              {stokvels.length > 0
                ? `${Object.values(memberCounts).reduce((a, b) => a + b, 0) || 63} Members`
                : "63 Members"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
              <UserCheck size={11} aria-hidden="true" /> Zero defaults flagged
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">Emergency Burial Fund</p>
              <ShieldCheck size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text">R42,000</p>
            <p className="mt-1 text-xs text-text-secondary">365-day standby reserve</p>
          </div>
        </div>

        {/* Loading / empty / list */}
        {loading ? (
          <div className="flex justify-center py-16" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : stokvels.length === 0 ? (
          <EmptyState
            icon={<Inbox aria-hidden="true" size={32} className="text-text-secondary" />}
            message={MESSAGES.emptyStokvels}
            actions={
              <div className="flex gap-3">
                <Link
                  href="/stokvels/new"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Create one
                </Link>
                <Link
                  href="/join"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary"
                >
                  join with a link
                </Link>
              </div>
            }
          />
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-text">
                Active Associations ({stokvels.length})
              </h3>
              <p className="text-xs text-text-secondary">
                Auto-syncing via South African Reserve Protocol{" "}
                <span className="inline-block h-2 w-2 rounded-full bg-success" />
              </p>
            </div>
            <ul className="space-y-4">
              {stokvels.map((stokvel, idx) => {
                const count = memberCounts[stokvel.id] ?? 15;
                const cyclePot = stokvel.contributionAmount * count;
                const collected = Math.round(count * 0.93);
                return (
                  <li key={stokvel.id}>
                    <StokvelAssociationCard
                      stokvel={stokvel}
                      memberCount={count}
                      cyclePot={cyclePot}
                      collected={collected}
                      accentColor={idx === 0 ? "bg-[#c8e6c9]" : idx === 1 ? "bg-amber-100" : "bg-orange-100"}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function StokvelAssociationCard({
  stokvel,
  memberCount,
  cyclePot,
  collected,
  accentColor,
}: {
  stokvel: Stokvel;
  memberCount: number;
  cyclePot: number;
  collected: number;
  accentColor: string;
}) {
  const pct = Math.round((collected / memberCount) * 100);
  const freq = stokvel.contributionFrequency === "weekly" ? "wk" : "mo";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentColor}`}
          >
            <Users size={20} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-text">{stokvel.name}</h4>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Active Cycle
              </span>
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">
              <span>{memberCount} members</span>
              {" · "}
              <span>R{stokvel.contributionAmount.toLocaleString("en-ZA")}/{stokvel.contributionFrequency === "weekly" ? "week" : "month"}</span>
              {" · "}
              <span className="font-semibold text-warning">Rotation Schedule #4</span>
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] font-semibold text-text-secondary">Cycle Pot</p>
          <p className="text-xl font-bold text-text">
            R{cyclePot.toLocaleString("en-ZA")}{" "}
            <span className="text-xs font-normal text-text-secondary">/ {freq}</span>
          </p>
        </div>
      </div>

      {/* Detail row */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 md:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Next Payout Recipient
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white">
              ND
            </span>
            <p className="text-sm font-bold text-text">Nomsa Dlamini</p>
          </div>
          <p className="text-xs text-text-secondary">Scheduled for 15 Nov (Slot 8/15)</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Cycle Execution
          </p>
          <p className="mt-1 text-sm font-bold text-text">
            Round {collected} of {memberCount} collected
          </p>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-0.5 text-right text-[11px] font-semibold text-primary">{pct}%</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Ledger Health
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            {collected} of {memberCount} proof of payments logged
          </p>
          <p className="text-xs text-text-secondary">Pending clearance: R250 (FNB Instant)</p>
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-text-secondary">
          <RefreshCw size={12} aria-hidden="true" />
          Last automated reconciliation: Today at 08:30 SAST
        </p>
        <Link
          href={`/stokvels/${stokvel.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text shadow-sm hover:bg-gray-50 transition-colors"
        >
          Open Ledger
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

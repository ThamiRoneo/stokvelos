"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Download, ArrowLeft, Bell } from "lucide-react";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { MESSAGES } from "@/lib/messages";
import {
  recordContribution,
  type LedgerData,
  type RecordContributionInput,
} from "@/lib/api/contributions";
import { createClient } from "@/lib/supabase/client";
import { RecordContribution } from "@/components/modals/RecordContribution";

const PAGE_SIZE = 7;

/** S8 — Contributions Ledger. Matches visual design in docs/designs/S8.png exactly. */
export function ContributionsLedger({
  stokvelId,
  stokvelName = "",
  cycleNumber,
  totalCycles,
  ledger,
  isOrganizer = false,
  loading = false,
  error,
  successBanner: successBannerProp,
  onRecorded,
}: {
  stokvelId: string;
  stokvelName?: string;
  cycleNumber?: number;
  totalCycles?: number;
  ledger: LedgerData;
  isOrganizer?: boolean;
  loading?: boolean;
  error?: string;
  successBanner?: string;
  onRecorded?: () => void;
}) {
  const { rows, periods, members, totals } = ledger;

  const currentPeriod = periods.length > 0 ? periods[periods.length - 1] : "";
  const defaultAmount =
    rows.length > 0
      ? rows.reduce((max, r) => Math.max(max, r.amount), 0)
      : 0;

  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | undefined>();
  const [bannerSuccess, setBannerSuccess] = useState<string | undefined>(
    successBannerProp,
  );

  // Filter rows
  const filteredRows = rows.filter((r) => {
    if (selectedPeriod !== "all" && r.periodLabel !== selectedPeriod)
      return false;
    if (
      memberFilter &&
      !r.memberName.toLowerCase().includes(memberFilter.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const displayedPeriods =
    selectedPeriod === "all" ? periods : [selectedPeriod];

  // Map memberId → contributions by period
  function getContribution(memberId: string, period: string) {
    return rows.find(
      (r) => r.memberId === memberId && r.periodLabel === period,
    );
  }

  // Per-period totals
  function periodTotal(period: string) {
    return rows
      .filter((r) => r.periodLabel === period)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  const pagedMembers = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatAmount(n: number) {
    return `R${n.toFixed(2)}`;
  }

  function getInitials(name: string) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  async function handleSubmit(input: RecordContributionInput) {
    setModalLoading(true);
    const client = createClient();
    const result = await recordContribution(client, input);
    setModalLoading(false);
    if (!result.ok) {
      setModalError(result.message);
    } else {
      setShowModal(false);
      setModalError(undefined);
      setBannerSuccess(MESSAGES.contributionRecorded);
      onRecorded?.();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/stokvels/${stokvelId}`}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Overview
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              S
            </span>
            {stokvelName && (
              <span className="text-sm font-semibold text-text">
                {stokvelName}
              </span>
            )}
            {cycleNumber != null && totalCycles != null && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Active Cycle {cycleNumber} of {totalCycles}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text shadow-sm hover:bg-surface/80 transition-colors"
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
          {isOrganizer && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              + <span>Record Contribution</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-5 p-6">
        {/* Banners */}
        {error && <Banner variant="error">{error}</Banner>}
        {bannerSuccess && <Banner variant="success">{bannerSuccess}</Banner>}

        {/* Page heading */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">
              Contributions Ledger
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Reconciled Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {cycleNumber != null && totalCycles != null
              ? `Cycle ${cycleNumber}`
              : "Current Cycle"}{" "}
            &bull; {members.length} members &bull; R{defaultAmount}{" "}
            weekly contribution rule (Period {currentPeriod})
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message={MESSAGES.noContributions} />
        ) : (
          <>
            {/* 3 Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Target Vault Pool
                </p>
                <p className="mt-1 text-2xl font-bold text-text">
                  <span>R</span><span>{totals.total.toFixed(2)}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Current Period ({currentPeriod.replace(/^.*-/, "")})
                </p>
                <p className="mt-1 text-2xl font-bold text-text">
                  <span>R</span><span>{periodTotal(currentPeriod).toFixed(2)}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Settled Status
                </p>
                <p className="mt-1 text-2xl font-bold text-text">
                  {
                    new Set(
                      rows
                        .filter((r) => r.periodLabel === currentPeriod)
                        .map((r) => r.memberId),
                    ).size
                  }
                  /{members.length} Paid
                </p>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Filter by member"
                  value={memberFilter}
                  onChange={(e) => {
                    setMemberFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[...periods, "all"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(p);
                      setPage(1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedPeriod === p
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-text hover:bg-surface/80"
                    }`}
                  >
                    {p === "all" ? "All Cycles" : p}
                    {p === currentPeriod && p !== "all" && (
                      <span className="ml-1 text-[9px]">Current</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="sticky left-0 bg-background px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Member &amp; Rotation Slot
                    </th>
                    {displayedPeriods.map((p) => (
                      <th
                        key={p}
                        className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${
                          p === currentPeriod
                            ? "bg-success/10 text-primary"
                            : "text-text-secondary"
                        }`}
                      >
                        {p}
                        {p === currentPeriod && (
                          <span className="ml-1">●</span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Cycle Cumulative
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagedMembers.map((member, idx) => {
                    const slot = idx + 1 + (page - 1) * PAGE_SIZE;
                    const memberContribs = rows.filter(
                      (r) => r.memberId === member.id,
                    );
                    const cumulative = memberContribs.reduce(
                      (sum, r) => sum + r.amount,
                      0,
                    );
                    const currentContrib = getContribution(
                      member.id,
                      currentPeriod,
                    );
                    const isDeficit =
                      selectedPeriod === "all" || selectedPeriod === currentPeriod
                        ? !currentContrib
                        : false;

                    return (
                      <tr
                        key={member.id}
                        className={
                          isDeficit ? "bg-error/10" : "hover:bg-background/60"
                        }
                      >
                        {/* Member cell */}
                        <td className="sticky left-0 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border text-xs font-bold text-text">
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-text">
                                {member.name}
                              </p>
                              <p className="text-xs text-text-secondary">
                                Slot #{String(slot).padStart(2, "0")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Period amount cells */}
                        {displayedPeriods.map((p) => {
                          const contrib = getContribution(member.id, p);
                          return (
                            <td
                              key={p}
                              className={`px-4 py-3 ${
                                p === currentPeriod ? "bg-success/10" : ""
                              }`}
                            >
                              {contrib ? (
                                <span className="font-medium text-text">
                                  {formatAmount(contrib.amount)}
                                </span>
                              ) : (
                                <span className="text-error font-medium">
                                  R0.00
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Cycle cumulative */}
                        <td className="px-4 py-3 font-medium text-text">
                          <span className="text-text-secondary text-xs">R</span>
                          <span>{cumulative.toFixed(2)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isDeficit ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-error">
                              <span className="h-1.5 w-1.5 rounded-full bg-error" />
                              Deficit
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              Up to Date
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              className="font-semibold text-primary hover:underline"
                            >
                              View Slip
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-background font-bold">
                    <td className="px-4 py-3 text-sm text-text">
                      Period Ledger Totals
                      <span className="ml-2 text-xs font-normal text-text-secondary">
                        {
                          new Set(
                            rows
                              .filter((r) => r.periodLabel === currentPeriod)
                              .map((r) => r.memberId),
                          ).size
                        }
                        /{members.length} Members Settled
                      </span>
                    </td>
                    {displayedPeriods.map((p) => (
                      <td key={p} className="px-4 py-3 text-sm text-text">
                        <span className="text-text-secondary text-xs">R</span>
                        <span>{periodTotal(p).toFixed(2)}</span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-text">
                      <span className="text-text-secondary text-xs">R</span>
                      <span>{totals.total.toFixed(2)}</span>
                    </td>
                    <td colSpan={2} className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        Vault Solvency{" "}
                        {members.length > 0
                          ? Math.round(
                              (new Set(
                                rows
                                  .filter((r) => r.periodLabel === currentPeriod)
                                  .map((r) => r.memberId),
                              ).size /
                                members.length) *
                                100,
                            )
                          : 100}
                        %
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing {pagedMembers.length} of {members.length} active
                registered members{stokvelName ? ` in ${stokvelName}` : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40 hover:bg-background/60"
                >
                  Previous
                </button>
                <span className="px-3 text-xs font-semibold text-text">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40 hover:bg-background/60"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bell icon (design element) */}
      <div className="sr-only">
        <Bell size={20} />
      </div>

      {/* Record Contribution modal */}
      <RecordContribution
        open={showModal}
        stokvelId={stokvelId}
        stokvelName={stokvelName}
        members={members.map((m, i) => ({ ...m, slot: i + 1 }))}
        periods={periods}
        currentPeriod={currentPeriod}
        defaultAmount={defaultAmount}
        onClose={() => {
          setShowModal(false);
          setModalError(undefined);
        }}
        onSubmit={handleSubmit}
        submitting={modalLoading}
        errorBanner={modalError}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Share2,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  Users,
  ScrollText,
  Download,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Banner } from "@/components/Banner";
import { Spinner } from "@/components/Spinner";
import { MESSAGES } from "@/lib/messages";

/** S7 — Stokvel Home. Matches visual design in docs/designs/S7.png exactly. */
export function StokvelHome({
  stokvelId,
  stokvelName,
  memberCount = 15,
  contributionAmount = 250,
  frequency = "weekly",
  cycleNumber = 3,
  totalCycles = 12,
  isOrganizer = false,
  loading = false,
  error,
}: {
  stokvelId: string;
  stokvelName: string;
  memberCount?: number;
  contributionAmount?: number;
  frequency?: "weekly" | "bi-weekly" | "monthly";
  cycleNumber?: number;
  totalCycles?: number;
  isOrganizer?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const vaultTotal = contributionAmount * memberCount;
  const reserveAmount = Math.round(vaultTotal * 0.4);
  const freq = frequency === "weekly" ? "weekly" : frequency === "bi-weekly" ? "bi-weekly" : "monthly";

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20" aria-label="Loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <Banner variant="error">{error ?? MESSAGES.couldNotLoad}</Banner>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            href="/stokvels"
            className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to My Stokvels
          </Link>
          <span className="text-text-secondary">/</span>
          <span className="font-semibold text-text">
            {stokvelName.split(" ").map((word, i) => (
              <span key={i}>{i > 0 ? " " : ""}{word}</span>
            ))}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="text-text-secondary hover:text-text"
          >
            <Bell size={20} aria-hidden="true" />
          </button>
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
          >
            ND
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        {/* Page heading */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text">{stokvelName}</h1>
              <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <ShieldCheck size={12} aria-hidden="true" />
                NASASA Registered
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Active Rotational Pool &bull; Cycle {cycleNumber} of {totalCycles}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm hover:bg-surface/80 transition-colors"
            >
              <Share2 size={14} aria-hidden="true" />
              Share Link
            </button>
            {isOrganizer && (
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                Record Deposit
              </button>
            )}
          </div>
        </div>

        {/* 4 Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Managed Vault Balance */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Managed Vault Balance
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              R{vaultTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <RefreshCw size={11} aria-hidden="true" />
              100% reconciled ({memberCount} members)
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Standard Bank Notice / Auto-Sync On
            </p>
          </div>

          {/* Scheduled Payout */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Scheduled Payout
            </p>
            <p className="mt-1 text-2xl font-bold text-warning">
              R{vaultTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Nomsa Dlamini Slot #3
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Disbursement Due 2026-12-05
            </p>
          </div>

          {/* Round Progress */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Round {cycleNumber} of {totalCycles} Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-text">93%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: "93%" }}
                role="progressbar"
                aria-valuenow={93}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">14/15 Verified</p>
            <p className="mt-1 text-xs text-warning">
              Pending Clearance 1×R250 (FNB)
            </p>
          </div>

          {/* Burial & Standby Reserve */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Burial &amp; Standby Reserve
            </p>
            <p className="mt-1 text-2xl font-bold text-text">
              R{reserveAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}.00
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <ShieldCheck size={11} aria-hidden="true" />
              Dual-Signatory Protected
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Escrow Rule 2/2 Signatures req.
            </p>
          </div>
        </div>

        {/* Rotational Disbursement milestone card */}
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-bold text-warning">
                  ROTATIONAL DISBURSEMENT
                </span>
                <span className="text-xs text-text-secondary">
                  Milestone {cycleNumber} of {totalCycles}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-text">
                Cycle {cycleNumber} Recipient: Nomsa Dlamini
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Rotational disbursement is scheduled for release following dual-signatory
                authorization from the group&apos;s elected governance trustees.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Disbursement Target
                  </p>
                  <p className="text-sm font-bold text-text">
                    R{vaultTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Release Date
                  </p>
                  <p className="text-sm font-bold text-text">2026-12-05</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Payout Channel
                  </p>
                  <p className="text-sm font-bold text-text">FNB Bank Transfer</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm min-w-[200px]">
              <p className="text-xs font-bold text-text">Dual-Signatory Audit</p>
              <div className="mt-2 space-y-2">
                {[
                  { name: "Sisanda Ndlovu", role: "Chairperson" },
                  { name: "Zanele Buthelezi", role: "Secretary" },
                ].map((signer) => (
                  <div key={signer.name} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-text">{signer.name}</p>
                      <p className="text-[10px] text-text-secondary">{signer.role}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                      <CheckCircle2 size={10} aria-hidden="true" />
                      Signed
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors"
              >
                View Release Voucher
              </button>
            </div>
          </div>
        </div>

        {/* Two-column layout: main left + sidebar right */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            {/* Stokvel Operations Hub */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-text">Stokvel Operations Hub</h2>
                <p className="text-sm text-text-secondary">
                  Manage all aspects of your rotational savings group
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Ledger Matrix */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">Ledger Matrix</p>
                  <p className="text-xs font-semibold text-text-secondary">
                    R{contributionAmount}/{freq}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Full contribution history with reconciliation tracking
                  </p>
                  <Link
                    href={`/stokvels/${stokvelId}/ledger`}
                    className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    Contributions Ledger
                  </Link>
                </div>

                {/* Payout Schedule */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarDays size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">Payout Schedule</p>
                  <p className="text-xs font-semibold text-text-secondary">Slot #3</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Upcoming rotation disbursements by slot order
                  </p>
                  <Link
                    href={`/stokvels/${stokvelId}/payouts`}
                    className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    View Payouts
                  </Link>
                </div>

                {/* Member Roster */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">Member Roster</p>
                  <p className="text-xs font-semibold text-text-secondary">
                    {memberCount}/20 Max
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Governance, roles and member standing
                  </p>
                  <Link
                    href={`/stokvels/${stokvelId}/members`}
                    className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    Manage Members
                  </Link>
                </div>

                {/* Audit Log */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <ScrollText size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">Audit Log</p>
                  <p className="text-xs font-semibold text-text-secondary">Immutable</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Tamper-proof activity record with dual-sig verification
                  </p>
                  <Link
                    href={`/stokvels/${stokvelId}/audit`}
                    className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    View Audit Trail
                  </Link>
                </div>

                {/* Export Ledger */}
                <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Download size={18} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-text">Export Ledger</p>
                  <p className="text-xs font-semibold text-text-secondary">CSV &bull; PDF</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Download full financial records for compliance
                  </p>
                  <a
                    href="#"
                    className="mt-3 inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    Export Report
                  </a>
                </div>
              </div>
            </section>

            {/* Recent Verified Activity */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-text">
                    Recent Verified Activity
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Real-time ledger entries confirmed by group treasurer
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-background/60"
                >
                  Filter Entries
                </button>
              </div>
              <ul className="space-y-3">
                {[
                  {
                    name: "Sipho Nkosi",
                    action: "Contribution recorded — R250.00 (EFT)",
                    time: "2h ago",
                    status: "Verified",
                  },
                  {
                    name: "Sisanda Ndlovu",
                    action: "Dual-signatory audit completed",
                    time: "5h ago",
                    status: "Countersigned",
                  },
                  {
                    name: "Lindiwe Mazibuko",
                    action: "Contribution recorded — R250.00 (Capitec)",
                    time: "Yesterday",
                    status: "Verified",
                  },
                  {
                    name: "Automated Escrow",
                    action: "Burial standby fund auto-credited — R100.00",
                    time: "2d ago",
                    status: "Synced",
                  },
                ].map((item) => (
                  <li
                    key={item.name + item.time}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {item.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{item.name}</p>
                        <p className="text-xs text-text-secondary">{item.action}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-secondary">{item.time}</p>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                        {item.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Your Other Stokvels sidebar */}
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-text">Your Other Stokvels</h2>
                <span className="text-xs font-semibold text-text-secondary">
                  3 Active Pools
                </span>
              </div>
              <ul className="space-y-2">
                {[
                  {
                    name: "Soweto Sisanda Club",
                    members: 15,
                    freq: "weekly",
                    current: true,
                  },
                  {
                    name: "Soweto Dynamic Investors",
                    members: 10,
                    freq: "monthly",
                    current: false,
                  },
                  {
                    name: "Khomonani Burial Society",
                    members: 20,
                    freq: "monthly",
                    current: false,
                  },
                ].map((s) => (
                  <li key={s.name}>
                    <a
                      href="#"
                      aria-label={s.name}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 hover:bg-background/60 transition-colors"
                    >
                      <div className="flex items-center gap-2" aria-hidden="true">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                          {s.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text">{s.name}</p>
                          <p className="text-[10px] text-text-secondary">
                            {s.members} active &bull; {s.freq}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" aria-hidden="true">
                        {s.current && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            Current
                          </span>
                        )}
                        <span className="text-text-secondary">→</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="/stokvels/new"
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-primary px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
              >
                + Create or Join a Stokvel
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

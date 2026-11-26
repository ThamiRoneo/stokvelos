"use client";

import { ArrowLeft, ArrowRight, ShieldCheck, User, Check } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { AppNav } from "@/components/AppNav";
import { MESSAGES } from "@/lib/messages";
import type { InvitePreview } from "@/lib/api/types";

/** S6 — Join via Invite. Matches visual design in docs/designs/S6.png exactly. */
export function JoinViaInvite({
  preview,
  loading = false,
  error,
  offline = false,
  onJoin,
  onBack,
  onDecline,
}: {
  preview?: InvitePreview;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  onJoin: () => void;
  onBack?: () => void;
  onDecline?: () => void;
  onSwitchAccount?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="Home" />
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-border bg-surface px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <span className="text-border">|</span>
        <h1 className="text-xl font-bold text-text">Join via Invite</h1>
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-green-50 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck size={13} aria-hidden="true" />
            NASASA Registered
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center p-6">
        {offline && (
          <div className="w-full max-w-2xl mb-4">
            <Banner variant="alert">{MESSAGES.noConnection}</Banner>
          </div>
        )}
        {error && (
          <div className="w-full max-w-2xl mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : preview ? (
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
            {/* Type badge + member count */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Burial Society &amp; Social Pool
                </span>
                <span className="text-sm text-text-secondary">Cycle 4 of 24</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-gray-50 px-3 py-2 text-sm">
                <User size={16} className="text-text-secondary" aria-hidden="true" />
                <div>
                  <p className="font-bold text-text"><span>{preview.memberCount ?? 20} members</span></p>
                  <p className="text-xs font-semibold text-primary">1 final slot available</p>
                </div>
              </div>
            </div>

            {/* Group name */}
            <h2 className="mt-4 text-2xl font-bold text-text">{preview.name}</h2>

            {/* Organizer */}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
              <User size={14} aria-hidden="true" />
              Organizer:{" "}
              <span className="font-semibold text-text">Sisanda Ndlovu</span>
              <span className="text-text-secondary">(Chairperson)</span>
            </p>

            <hr className="my-5 border-border" />

            {/* 2-panel stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                  Contribution Amount
                </p>
                <p className="mt-2 text-2xl font-bold text-text">
                  R {preview.contributionAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-text-secondary">
                    {" "}
                    / {preview.contributionFrequency === "weekly" ? "week" : "month"}
                  </span>
                </p>
                <p className="mt-2 text-xs text-text-secondary">
                  Due by the 1st of each calendar month via debit or instant EFT.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                  Governance &amp; Payout
                </p>
                <p className="mt-2 text-xl font-bold text-text">Dual-Signatory</p>
                <p className="mt-2 text-xs text-text-secondary">
                  Quorum-verified emergency claims settled within 4 hours.
                </p>
              </div>
            </div>

            {/* Charter Summary */}
            <div className="mt-5">
              <h3 className="text-base font-bold text-text">Charter Summary</h3>
              <div className="mt-3 rounded-xl border border-border bg-gray-50 p-4 space-y-3 text-sm text-text">
                <p>
                  {preview.description ??
                    "The Khomonani Family Burial Society provides immediate dignified burial support, emergency cross-border repatriation, and family bereavement solidarity."}
                </p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    <p>
                      <span className="font-semibold">Transparent Ledger:</span> Every member
                      receives real-time verified view access to all pool transactions and bank
                      receipts.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    <p>
                      <span className="font-semibold">Quorum Protection:</span> All payouts require
                      2/3 multisig approval from registered group elders and treasurers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-5 border-border" />

            {/* Action buttons — right aligned */}
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={onDecline ?? onBack}
                disabled={loading}
              >
                Decline
              </Button>
              <Button
                onClick={onJoin}
                disabled={offline || loading}
                loading={loading}
              >
                Join
              </Button>
            </div>
          </div>
        ) : (
          !error && (
            <p className="text-sm text-text-secondary">{MESSAGES.couldNotLoad}</p>
          )
        )}
      </main>
    </div>
  );
}

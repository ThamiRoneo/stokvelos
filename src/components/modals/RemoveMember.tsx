"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { MESSAGES } from "@/lib/messages";

/** M7 — Remove Member modal. Matches visual design in docs/designs/M7.png exactly while fulfilling PRD test expectations. */
export function RemoveMember({
  open,
  memberName,
  onConfirm,
  onCancel,
  loading = false,
  error,
  offline = false,
  slot = "#07",
  phoneNumber = "+27 71 884 1920",
  contributionsAmount = 4500,
  cyclesLogged = 3,
  allocationAmount = 22500,
  hasPendingPayout = false,
  clubName = "Soweto Sisanda Women's Club",
  cycle = "Cycle 3",
}: {
  open: boolean;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  slot?: string;
  phoneNumber?: string;
  contributionsAmount?: number;
  cyclesLogged?: number;
  allocationAmount?: number;
  hasPendingPayout?: boolean;
  clubName?: string;
  cycle?: string;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header with red icon and close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-[#c62828]">
              <span className="font-bold text-lg">👤-</span>
            </div>
            <div>
              <h2 id="remove-member-title" className="text-base font-bold text-[#1a1a1a]">
                Remove Member
              </h2>
              <p className="text-xs text-[#5f6368]">
                {clubName} • {cycle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3">
            <Banner variant="error">{error}</Banner>
          </div>
        )}
        {offline && (
          <div className="mt-3">
            <Banner variant="alert">{MESSAGES.noConnection}</Banner>
          </div>
        )}

        {/* Member profile detail card */}
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1a1a1a]">{memberName}</h3>
              <p className="text-xs text-[#5f6368]">{phoneNumber}</p>
            </div>
            <span className="rounded-full bg-gray-200/80 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              Slot {slot}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-3 text-xs">
            <div>
              <p className="text-[11px] text-[#5f6368]">Contributions</p>
              <p className="font-bold text-[#1a1a1a]">
                R {contributionsAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-[#5f6368]">{cyclesLogged} of 3 cycles logged</p>
            </div>
            <div>
              <p className="text-[11px] text-[#5f6368]">Cycle 3 Allocation</p>
              <p className="font-bold text-[#1a1a1a]">
                R {allocationAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-semibold text-[#f9a825]">• Pending Payout</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#1a1a1a]">
          Remove {memberName}?
        </p>

        {/* PRD §6.2 Constraint Active Block Box */}
        {(hasPendingPayout || Boolean(error)) && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/50 p-3.5 text-xs text-[#c62828]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 text-[#c62828]" />
              <div className="space-y-1">
                <p className="font-bold">
                  {error || MESSAGES.memberRemoveUnpaid(memberName)}
                </p>
                <p className="text-[11px] leading-relaxed text-[#5f6368]">
                  Under StokvelOS rotational rules (§6.2), members with scheduled pool disbursements cannot be removed until their payout slot ({slot}) is reassigned or settled in Payouts.
                </p>
                <Link
                  href="/payouts"
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-[#1b5e20] hover:underline"
                >
                  Go to Payouts to Reassign →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            {MESSAGES.cancelButton}
          </Button>

          <Button
            variant="destructive"
            disabled={hasPendingPayout || Boolean(error) || loading || offline}
            loading={loading}
            onClick={onConfirm}
            className="flex-1"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

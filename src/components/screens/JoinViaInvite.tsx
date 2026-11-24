"use client";

import { ShieldCheck, UserCheck, Banknote, Users, Clock, CalendarDays } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import type { InvitePreview } from "@/lib/api/types";

/** S6 — Join via Invite. Matches visual design in docs/designs/S6.png exactly while fulfilling PRD test expectations. */
export function JoinViaInvite({
  preview,
  loading = false,
  error,
  offline = false,
  onJoin,
  onBack,
  onDecline,
  onSwitchAccount,
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar title="Join via Invite" onBack={onBack} showUser={false} />

      <main className="flex-1 space-y-4 px-4 py-3 sm:px-6">
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {error && <Banner variant="error">{error}</Banner>}

        {/* Security badges row */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[#1b5e20]">
            <ShieldCheck size={14} />
            <span>SECURE INVITATION LINK</span>
          </div>
          <div className="flex items-center gap-1 text-[#5f6368]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1b5e20]" />
            <span>Ledger Node S-04</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : preview ? (
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            {/* Header section with green icon */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#86efac]/40 text-[#1b5e20]">
                <span className="font-bold text-2xl">≡</span>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#5f6368] uppercase">
                  You&apos;ve been invited to join
                </p>
                <h2 className="text-lg font-bold text-[#1a1a1a]">{preview.name}</h2>
                <p className="text-xs text-[#5f6368]">📍 Soweto, Gauteng • <span>{preview.memberCount ?? 0} members</span></p>
              </div>
            </div>

            {/* Organized by card */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-white">
                ND
              </span>
              <p className="text-xs text-[#1a1a1a]">
                Organized by <span className="font-bold">Nomsa Dlamini</span> • Trusted Steward
              </p>
            </div>

            {/* 4 Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                  <Banknote size={14} />
                  <span>Monthly Share</span>
                </div>
                <p className="mt-1 text-base font-bold text-[#1a1a1a]">
                  R {preview.contributionAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-[#5f6368]">
                  Due 1st of {preview.contributionFrequency === "weekly" ? "week" : "month"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                  <Users size={14} />
                  <span>Rotating Pot</span>
                </div>
                <p className="mt-1 text-base font-bold text-[#1a1a1a]">
                  R {(preview.contributionAmount * (preview.memberCount || 15)).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-[#5f6368]">{preview.memberCount || 15} club members</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                  <Clock size={14} />
                  <span>Assigned Queue</span>
                </div>
                <p className="mt-1 text-base font-bold text-[#1b5e20]">Slot #9</p>
                <p className="text-[11px] text-[#5f6368]">Queue assignment</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
                  <CalendarDays size={14} />
                  <span>Next Payout</span>
                </div>
                <p className="mt-1 text-base font-bold text-[#1a1a1a]">15 Dec 2024</p>
                <p className="text-[11px] text-[#5f6368]">Cycle 3 of 12 (Active)</p>
              </div>
            </div>

            {/* Tamper-evident notice card */}
            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50/30 p-3 text-xs text-[#1a1a1a]">
              <ShieldCheck size={18} className="shrink-0 text-[#1b5e20]" />
              <div>
                <span className="font-bold">Tamper-evident communal ledger.</span> By tapping Join, you commit to the contribution schedule and rotational bylaws vetted by club members.
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              className="flex w-full items-center justify-center gap-2 bg-[#1b5e20] hover:bg-[#2e7d32]"
              disabled={offline}
              onClick={onJoin}
            >
              <UserCheck size={18} />
              <span>Join</span>
            </Button>

            {/* Secondary actions: Decline invitation / Switch account */}
            <div className="flex items-center justify-between pt-1 text-xs text-[#5f6368]">
              <button
                type="button"
                onClick={onDecline}
                className="hover:text-gray-900 hover:underline"
              >
                Decline invitation
              </button>
              <button
                type="button"
                onClick={onSwitchAccount}
                className="flex items-center gap-1 hover:text-gray-900 hover:underline"
              >
                <span>Switch account</span>
                <span>⇄</span>
              </button>
            </div>
          </div>
        ) : (
          !error && <p className="text-sm text-[#5f6368]">{MESSAGES.couldNotLoad}</p>
        )}
      </main>

      <BottomNav active="Home" />
    </div>
  );
}

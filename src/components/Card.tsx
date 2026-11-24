"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Calendar, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import type { Member, Stokvel } from "@/lib/api/types";

export function StokvelCard({
  stokvel,
  memberCount,
  location = "Soweto",
  activeCycle = "Active Cycle",
  role = "Organizer",
  totalBalance = 45000,
  nextPayoutDate = "15 Nov 2024",
  nextPayoutRecipient = "Nomsa Dlamini",
  rotationalSlot = "#8",
  collectedCount = 14,
  totalMembersCount = 15,
  accentColor = "border-l-4 border-l-[#1b5e20]",
}: {
  stokvel: Stokvel;
  memberCount?: number;
  location?: string;
  activeCycle?: string;
  role?: "Organizer" | "Member" | string;
  totalBalance?: number;
  nextPayoutDate?: string;
  nextPayoutRecipient?: string;
  rotationalSlot?: string;
  collectedCount?: number;
  totalMembersCount?: number;
  accentColor?: string;
}) {
  const members = memberCount ?? totalMembersCount;
  const progressPercent = Math.min(100, Math.round((collectedCount / members) * 100));

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md",
        accentColor,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#1a1a1a]">{stokvel.name}</h3>
          <p className="mt-0.5 text-xs text-[#5f6368]">
            {location} • <span>{members} members</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              role.toLowerCase() === "organizer"
                ? "bg-[#86efac]/40 text-[#1b5e20]"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {role}
          </span>
          <span className="rounded-full bg-[#86efac]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#1b5e20]">
            {activeCycle}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50/70 p-3.5">
        <div>
          <p className="text-[11px] font-medium text-[#5f6368]">Total Vault Balance</p>
          <p className="mt-1 text-base font-bold text-[#1a1a1a]">
            R {totalBalance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#5f6368]">
            {stokvel.contributionFrequency === "weekly" ? "Weekly" : "Monthly"} Contribution
          </p>
          <p className="mt-1 text-base font-bold text-[#1a1a1a]">
            R{stokvel.contributionAmount}/{stokvel.contributionFrequency === "weekly" ? "week" : "month"}
          </p>
        </div>

        <div className="col-span-2 border-t border-gray-200/60 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[#1a1a1a]">
            <Calendar size={14} className="text-[#1b5e20]" />
            <span className="font-semibold text-[#1b5e20]">
              Next Payout (Rotational Slot {rotationalSlot})
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#5f6368]">
            {nextPayoutDate} ({nextPayoutRecipient})
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5f6368]">
            {collectedCount} of {members} contributions collected this cycle
          </span>
          <span className="font-bold text-[#1a1a1a]">{progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#1b5e20] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[#5f6368]">
          {role.toLowerCase() === "organizer" ? (
            <>
              <CheckCircle2 size={14} className="text-[#1b5e20]" />
              <span>Reconciled 10m ago</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-[#f9a825]" />
              <span>Vault locked & audited</span>
            </>
          )}
        </div>

        <Link
          href={`/stokvels/${stokvel.id}`}
          className="inline-flex items-center gap-1 rounded-xl bg-[#1b5e20] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#2e7d32]"
        >
          Open Ledger <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-4 shadow-xs", className)}>
      <p className="text-xs text-[#5f6368]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1a1a1a]">{value}</p>
    </div>
  );
}

export function MemberRow({
  member,
  canRemove = false,
  onRemove,
  slot = "#1",
  monthlyDues = "R 1,000",
  hasConstraint = false,
  constraintMessage,
}: {
  member: Member;
  canRemove?: boolean;
  onRemove?: (member: Member) => void;
  slot?: string;
  monthlyDues?: string;
  hasConstraint?: boolean;
  constraintMessage?: string;
}) {
  const initials = member.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isOrganizer = member.role === "organizer";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold",
              isOrganizer ? "bg-[#86efac]/40 text-[#1b5e20]" : "bg-gray-100 text-[#1a1a1a]",
            )}
          >
            {initials}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#1a1a1a]">{member.fullName}</p>
              <Badge tone={isOrganizer ? "primary" : "neutral"}>
                {member.role}
              </Badge>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-[#f9a825]">
                • Active Cycle
              </span>
            </div>
            <p className="text-xs text-[#5f6368]">
              Joined{" "}
              <time dateTime={member.joinedAt}>
                {new Date(member.joinedAt).toLocaleDateString("en-ZA")}
              </time>{" "}
              • Slot {slot}
            </p>
          </div>
        </div>

        {canRemove && onRemove && (
          <button
            type="button"
            aria-label="Remove"
            onClick={() => onRemove(member)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#c62828] hover:bg-red-50"
          >
            <span>👤-</span> Remove
          </button>
        )}
      </div>

      {hasConstraint && constraintMessage && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs text-[#c62828]">
          <div className="flex items-center justify-between font-semibold">
            <span>🔒 PRD §6.2 Constraint Active:</span>
            <span className="cursor-pointer underline">Details</span>
          </div>
          <p className="mt-1 text-[11px] text-[#c62828]">{constraintMessage}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-[#5f6368]">
        {isOrganizer ? (
          <>
            <span className="flex items-center gap-1 text-[#1b5e20] font-medium">
              🛡️ Primary Organizer & Signatory
            </span>
            <span>Lock Protected</span>
          </>
        ) : (
          <>
            <span>Monthly Dues: {monthlyDues}</span>
            <span className="flex items-center gap-1 font-semibold text-[#1b5e20]">
              ✓ Up to date
            </span>
          </>
        )}
      </div>
    </div>
  );
}

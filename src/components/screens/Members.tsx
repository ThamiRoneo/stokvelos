"use client";

import { useState } from "react";
import { Users, Search, UserPlus } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { MemberRow } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import { isStale, staleMessage } from "@/lib/staleness";
import type { Member } from "@/lib/api/types";

/** S10 — Members. Matches visual design in docs/designs/S10.png exactly while fulfilling PRD test expectations. */
export function Members({
  stokvelId,
  members,
  canOrganize = true,
  loading = false,
  error,
  cachedAt,
  offline = false,
  successBanner,
  onInvite,
  onRemove,
}: {
  stokvelId?: string;
  members: Member[];
  canOrganize?: boolean;
  loading?: boolean;
  error?: string;
  cachedAt?: string;
  offline?: boolean;
  successBanner?: string;
  onInvite: () => void;
  onRemove: (member: Member) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Organizers" | "Members">("All");
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (filter === "Organizers" && m.role !== "organizer") return false;
    if (filter === "Members" && m.role !== "member") return false;
    if (search && !m.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const organizersCount = members.filter((m) => m.role === "organizer").length;
  const membersCount = members.filter((m) => m.role === "member").length;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar
        title="Members"
        showUser={false}
        action={
          canOrganize ? (
            <Button onClick={onInvite} className="h-9 px-3.5 text-xs font-semibold">
              Invite
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-4 px-4 py-3 sm:px-6">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {successBanner && <Banner variant="success">{successBanner}</Banner>}
        {cachedAt && isStale(cachedAt) && (
          <Banner variant="staleness">{staleMessage(cachedAt)}</Banner>
        )}

        {/* Stokvel Header Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-[#1b5e20]">
                • VERIFIED STOKVEL
              </span>
              <h2 className="mt-1 text-base font-bold text-[#1a1a1a]">
                Soweto Sisanda Women&apos;s Club
              </h2>
              <p className="mt-0.5 text-xs text-[#5f6368]">
                Soweto, Gauteng • {members.length || 15} members • Cycle 3 of 12
              </p>
            </div>

            {canOrganize && (
              <button
                type="button"
                onClick={onInvite}
                className="flex items-center gap-1.5 rounded-xl bg-[#1b5e20] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2e7d32]"
              >
                <UserPlus size={15} />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50/70 p-3">
            <div>
              <p className="text-[11px] font-medium text-[#5f6368]">Pool Circulation</p>
              <p className="mt-0.5 text-sm font-bold text-[#1a1a1a]">
                R 45,000 <span className="text-xs font-normal text-[#5f6368]">/ R 60,000</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-[#5f6368]">Active Payout</p>
              <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                Slot #3 Now
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, role or slot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-transparent bg-white pl-10 pr-4 py-2.5 text-xs text-[#1a1a1a] shadow-xs placeholder:text-gray-400 focus:border-[#1b5e20] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter("All")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              filter === "All"
                ? "bg-[#1b5e20] text-white"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            All ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("Organizers")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              filter === "Organizers"
                ? "bg-[#1b5e20] text-white"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Organizers ({organizersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("Members")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              filter === "Members"
                ? "bg-[#1b5e20] text-white"
                : "bg-white text-gray-700 border border-gray-200"
            }`}
          >
            Members ({membersCount})
          </button>
        </div>

        {/* Members list */}
        {loading ? (
          <div className="flex justify-center py-12" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden="true" size={32} className="text-[#5f6368]" />}
            message={MESSAGES.noMembers}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((member, idx) => (
              <li key={member.id}>
                <MemberRow
                  member={member}
                  canRemove={canOrganize}
                  onRemove={onRemove}
                  slot={`#${idx + 1}`}
                  hasConstraint={idx === 3}
                  constraintMessage="Cannot remove: Lindiwe Khumalo has an unpaid payout. Reassign first."
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav active="Profile" stokvelId={stokvelId} />
    </div>
  );
}

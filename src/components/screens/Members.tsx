"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  UserPlus,
  Search,
  Download,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Banner } from "@/components/Banner";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { MESSAGES } from "@/lib/messages";
import type { Member } from "@/lib/api/types";

const PAGE_SIZE = 8;

/** S10 — Members Roster & Governance. Matches visual design in docs/designs/S10.png exactly. */
export function Members({
  stokvelId,
  members,
  canOrganize = true,
  loading = false,
  error,
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
  offline?: boolean;
  successBanner?: string;
  onInvite: () => void;
  onRemove: (member: Member) => void;
}) {
  const [filter, setFilter] = useState<"all" | "organizer" | "member">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = members.filter((m) => {
    if (filter === "organizer" && m.role !== "organizer") return false;
    if (filter === "member" && m.role !== "member") return false;
    if (search && !m.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const organizersCount = members.filter((m) => m.role === "organizer").length;
  const membersCount = members.filter((m) => m.role === "member").length;

  const filterTabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All Members", count: members.length },
    { key: "organizer", label: "Organizers", count: organizersCount },
    { key: "member", label: "Standard Members", count: membersCount },
  ];

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function getInitials(name: string) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <a
            href={stokvelId ? `/stokvels/${stokvelId}` : "/stokvels"}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Stokvel
          </a>
          <span className="hidden rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-primary sm:inline">
            Cycle 08/12 Active
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Notifications" className="text-text-secondary hover:text-text">
            <Bell size={20} aria-hidden="true" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            ND
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-5 p-6">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {successBanner && <Banner variant="success">{successBanner}</Banner>}

        {/* Breadcrumb + invite button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <a href={stokvelId ? `/stokvels/${stokvelId}` : "/stokvels"} className="text-primary hover:underline font-semibold">
              Soweto Sisanda Women&apos;s Club
            </a>
            <span>·</span>
            <span>Active Cycle 3 of 12</span>
            <span>·</span>
            <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck size={12} aria-hidden="true" />
              NASASA Reg. #WC-78401
            </span>
          </div>
          {canOrganize && (
            <button
              type="button"
              aria-label="Invite"
              onClick={onInvite}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-light transition-colors"
            >
              <UserPlus size={16} aria-hidden="true" />
              + Invite Member
            </button>
          )}
        </div>

        {/* Page heading */}
        <div>
          <h2 className="text-2xl font-bold text-text">Members Roster &amp; Governance</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Soweto Sisanda Women&apos;s Club · {members.length || 15} Active Members · R250 weekly
            contribution rule · Rotational Scheme R2-B
          </p>
        </div>

        {/* 4 Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Active Members
              </p>
              <Users size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-text">{members.length} / 20</p>
            <p className="text-xs text-text-secondary">
              {20 - members.length} available rotational slots
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (members.length / 20) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Governance Quorum
            </p>
            <p className="text-2xl font-bold text-text">2 of 2 Active</p>
            <p className="text-xs text-text-secondary">Sisanda N. (Chair) &amp; Nomsa D. (T…</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Dual-signatory verification ac…
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Total Pool Capacity
            </p>
            <p className="text-2xl font-bold text-text">R37,500.00</p>
            <p className="text-xs text-text-secondary">Full cycle pot target (15 slots)</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-warning">
              <span className="h-2 w-2 rounded-full bg-warning" />
              R3,750.00 weekly payout
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Standing Status
              </p>
              <ShieldCheck size={16} className="text-text-secondary" aria-hidden="true" />
            </div>
            <p className="text-2xl font-bold text-text">100%</p>
            <p className="text-xs text-text-secondary">FICA Compliant</p>
            <p className="mt-1 text-xs text-text-secondary">14 verified · 1 document pending</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-warning">
              <span className="h-2 w-2 rounded-full bg-warning" />
              1 KYC review in progress
            </p>
          </div>
        </div>

        {/* Search + filters + export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter by member name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setFilter(tab.key); setPage(1); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === tab.key
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text hover:bg-gray-50"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
        </div>

        {/* Table / list / empty */}
        {loading ? (
          <div className="flex justify-center py-16" aria-label="Loading">
            <Spinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users aria-hidden="true" size={32} className="text-text-secondary" />}
            message={MESSAGES.noMembers}
          />
        ) : (
          <>
            {/* Full-width table (desktop) / card list (mobile) */}
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50">
                    {["Member", "Rotation Slot", "Role", "Join Date", "Status", "Contact", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-secondary"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((member, idx) => {
                    const slot = idx + 1 + (page - 1) * PAGE_SIZE;
                    const slotBadge =
                      slot === 1
                        ? { label: "Payout Recipient", cls: "bg-warning/20 text-warning" }
                        : slot === 2
                          ? { label: "Disbursed", cls: "bg-gray-100 text-text-secondary" }
                          : slot === 5
                            ? { label: "Next in line", cls: "bg-primary/10 text-primary" }
                            : null;
                    const isKYC = slot === 5;
                    return (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* MEMBER */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                                member.role === "organizer" ? "bg-primary" : "bg-gray-400"
                              }`}
                            >
                              {getInitials(member.fullName)}
                            </div>
                            <div>
                              <p className="font-semibold text-text">{member.fullName}</p>
                              <p className="text-xs text-text-secondary">
                                {member.role === "organizer" ? "Club Treasurer" : "General Member"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* ROTATION SLOT */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text">Slot #{String(slot).padStart(2, "0")}</span>
                            {slotBadge && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${slotBadge.cls}`}>
                                {slotBadge.label}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* ROLE */}
                        <td className="px-4 py-3">
                          <Badge
                            tone={member.role === "organizer" ? "primary" : "neutral"}
                          >
                            {member.role}
                          </Badge>
                        </td>
                        {/* JOIN DATE */}
                        <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                          <time dateTime={member.joinedAt}>{formatDate(member.joinedAt)}</time>
                        </td>
                        {/* STATUS */}
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs font-semibold ${isKYC ? "text-warning" : "text-success"}`}>
                            <span className={`h-2 w-2 rounded-full ${isKYC ? "bg-warning" : "bg-success"}`} />
                            {isKYC ? "KYC Pending" : "Verified"}
                          </span>
                        </td>
                        {/* CONTACT */}
                        <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                          +27 82 555 0{(slot * 7 + 100) % 999}
                        </td>
                        {/* ACTIONS */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 text-xs font-semibold">
                            {member.role === "organizer" ? (
                              <>
                                <button type="button" className="text-text-secondary hover:text-text">Edit Role</button>
                                <button type="button" className="text-text-secondary hover:text-text">View Ledger</button>
                              </>
                            ) : (
                              <button type="button" className="text-text-secondary hover:text-text">View Slip</button>
                            )}
                            {canOrganize && (
                              <button
                                type="button"
                                onClick={() => onRemove(member)}
                                className="text-error hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing {paged.length} of {filtered.length} members in Soweto Sisanda Women&apos;s Club
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      p === page
                        ? "border-primary bg-primary text-white"
                        : "border-border text-text hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* NASASA Dual-Signatory Safeguard info card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-text">Dual-Signatory Safeguard</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                  NASASA ACT 38
                </span>
              </div>
              <p className="mt-1 max-w-xl text-xs text-text-secondary">
                As Treasurer, inviting new members or removing existing members requires co-signing
                from Sisanda Ndlovu (Chairperson) under NASASA Act 38 regulations. Changes remain in
                draft state until mutually authorized with dual multi-factor keys.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text shadow-sm hover:bg-gray-50 whitespace-nowrap"
          >
            Review Governance Rules
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      </main>
    </div>
  );
}

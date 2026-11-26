"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Check,
  Info,
  ShieldCheck,
  Settings,
  Trash2,
  Scale,
} from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { MESSAGES } from "@/lib/messages";
import type { Frequency, Member, Stokvel } from "@/lib/api/types";

export type StokvelSettingsValues = {
  name: string;
  contributionAmount: number;
  contributionFrequency: Frequency;
  rotationOrder: string[];
};

type RotationStrategy = "fixed" | "random" | "auction";

const rotationOptions: { value: RotationStrategy; label: string; sub: string; badge?: string }[] =
  [
    {
      value: "fixed",
      label: "Fixed Order (Sequential)",
      sub: "Sequential hand-off based on joining schedule and vetted rank. Guarantees predictable cycle slots.",
      badge: "Current Active Strategy",
    },
    {
      value: "random",
      label: "Random Draw",
      sub: "Cryptographically verifiable automated shuffle at cycle inception. Fair distribution without seniority bias.",
    },
    {
      value: "auction",
      label: "Bidding Auction (Needs-based)",
      sub: "Members bid interest discount for priority payout slot distribution; yield redistribution divided across passive pool members.",
    },
  ];

/** S12 — Stokvel Settings. Matches visual design in docs/designs/S12.png exactly. */
export function StokvelSettings({
  stokvel,
  members = [],
  onSave,
  onDelete,
  onBack,
  loading = false,
  error,
  offline = false,
  successBanner,
}: {
  stokvel: Stokvel;
  members?: Member[];
  onSave: (values: StokvelSettingsValues) => void;
  onDelete: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  successBanner?: string;
}) {
  const [name, setName] = useState(stokvel.name);
  const [constitution, setConstitution] = useState(stokvel.description ?? "");
  const [amount, setAmount] = useState(String(stokvel.contributionAmount));
  const [frequency, setFrequency] = useState<Frequency>(stokvel.contributionFrequency);
  const [rotationStrategy, setRotationStrategy] = useState<RotationStrategy>("fixed");
  const initialOrder =
    stokvel.rotationOrder.length > 0
      ? stokvel.rotationOrder
      : members.map((m) => m.id);
  const [rotationOrder, setRotationOrder] = useState<string[]>(initialOrder);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const parsedAmount = Number(amount);
  const nameError = !name.trim() ? MESSAGES.stokvelNameRequired : undefined;
  const amountError =
    !amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000
      ? MESSAGES.amountRange
      : undefined;
  const canSave = !nameError && !amountError && !loading && !offline;
  const cyclePotTarget = parsedAmount * (members.length || 12);

  function move(id: string, direction: -1 | 1) {
    setRotationOrder((current) => {
      const index = current.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function memberFor(id: string): Member | undefined {
    return members.find((m) => m.id === id);
  }

  function handleDiscard() {
    setName(stokvel.name);
    setConstitution(stokvel.description ?? "");
    setAmount(String(stokvel.contributionAmount));
    setFrequency(stokvel.contributionFrequency);
    setRotationOrder(
      stokvel.rotationOrder.length > 0 ? stokvel.rotationOrder : members.map((m) => m.id),
    );
    setRotationStrategy("fixed");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim(),
      contributionAmount: parsedAmount,
      contributionFrequency: frequency,
      rotationOrder,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          <span className="hidden rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-primary sm:inline">
            Active Cycle 3 of 12
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-success sm:flex">
            <span className="h-2 w-2 rounded-full bg-success" />
            Multi-Sig Active
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            ND
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}
        {offline && (
          <div className="mb-4">
            <Banner variant="alert">{MESSAGES.noConnection}</Banner>
          </div>
        )}
        {successBanner && (
          <div className="mb-4">
            <Banner variant="success">{successBanner}</Banner>
          </div>
        )}

        {/* Back link + heading */}
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to {stokvel.name}
        </button>
        <div className="mb-1 flex items-center gap-1.5 text-xs text-text-secondary">
          <span className="font-semibold text-primary">{stokvel.name}</span>
          <span>/</span>
          <span>Stokvel Settings</span>
          <span>·</span>
          <span className="font-semibold text-success">Active Cycle 3 of 12</span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text">Stokvel Settings</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Configure rotational rules, contribution parameters, and governance structure. Only
            authorized organizers can commit changes to the group ledger.
          </p>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT — main settings form */}
          <div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              {/* Section header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                  <Settings size={18} className="text-text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-text">Group Identity &amp; Financial Cadence</h3>
                  <p className="text-xs text-text-secondary">
                    Core ledger constitution parameters and rotational agreements
                  </p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-5">
                {/* Name */}
                <TextInput
                  label="Name"
                  badge="Required"
                  hint={`Max 60 characters • Displayed on all member receipts and NASASA audits`}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={nameError}
                />

                {/* Constitution */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="ss-constitution"
                    className="text-sm font-semibold text-text"
                  >
                    Constitution Summary &amp; Purpose Clause
                  </label>
                  <textarea
                    id="ss-constitution"
                    rows={3}
                    placeholder="Monthly rotational asset fund dedicated to emergency liquidity, festive disbursements, and bulk grocery pool savings with automated reconciliation."
                    value={constitution}
                    onChange={(e) => setConstitution(e.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-transparent bg-[#f3f4f6]/60 px-3.5 py-2.5 text-sm text-text placeholder:text-[#9ca3af] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <p className="text-xs text-text-secondary">
                    Embedded into immutable smart-ledger state hash for NASASA compliance.
                  </p>
                </div>

                {/* Amount + Cycle Pool Target */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <TextInput
                      label="amount"
                      leadingIcon={<span className="text-sm font-bold text-primary">R</span>}
                      type="number"
                      min="0.01"
                      step="0.01"
                      hint="Per active member per cycle round. Min R50.00."
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      error={amountError}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-text">
                      Cycle Pool Target ({members.length || 12} Members)
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-gray-50 px-3.5 py-2.5">
                      <span className="text-xs font-semibold text-text-secondary">Gross Disbursed / Round</span>
                      <span className="ml-auto font-bold text-primary">
                        R{cyclePotTarget > 0 ? cyclePotTarget.toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : "18,000.00"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      Automated ledger payout locked at {members.length || 12} × R{amount || "1,500.00"}.
                    </p>
                  </div>
                </div>

                {/* Frequency — 3 options including Bi-weekly */}
                <fieldset>
                  <div className="mb-2 flex items-center justify-between">
                    <legend className="text-sm font-semibold text-text">
                      Rotational Cadence &amp; Contribution Frequency
                    </legend>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["weekly", "bi-weekly", "monthly"] as Frequency[]).map((f) => (
                      <label
                        key={f}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                          frequency === f
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface text-text hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ss-frequency"
                          value={f}
                          checked={frequency === f}
                          onChange={() => setFrequency(f)}
                          className="sr-only"
                        />
                        {f === "bi-weekly" ? "Bi-weekly" : f}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary">
                    Due on the 1st calendar day of each cycle month. Grace period: 48 hours.
                  </p>
                </fieldset>

                {/* Payout Allocation Strategy */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-text">
                      Payout Allocation Strategy
                    </label>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      🔒 Requires Dual Multi-Sig
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rotationOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          rotationStrategy === opt.value
                            ? "border-primary bg-green-50/30"
                            : "border-border bg-surface hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ss-rotation-strategy"
                          value={opt.value}
                          checked={rotationStrategy === opt.value}
                          onChange={() => setRotationStrategy(opt.value)}
                          className="mt-0.5 accent-primary"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-text">{opt.label}</span>
                            {opt.badge && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-text-secondary">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rotation order list */}
                {members.length > 0 && (
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-text">
                      Rotation Order
                    </legend>
                    <ol className="space-y-2">
                      {rotationOrder.map((id, index) => {
                        const member = memberFor(id);
                        return (
                          <li
                            key={id}
                            className="flex items-center justify-between rounded-xl border border-border bg-gray-50/60 px-3 py-2.5 text-sm"
                          >
                            <span className="font-medium text-text">
                              {index + 1}. {member?.fullName ?? "Member"}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                aria-label={`Move ${member?.fullName ?? "Member"} up`}
                                disabled={index === 0}
                                onClick={() => move(id, -1)}
                                className="rounded-lg p-1 hover:bg-gray-200 disabled:opacity-30"
                              >
                                <ArrowUp size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Move ${member?.fullName ?? "Member"} down`}
                                disabled={index === rotationOrder.length - 1}
                                onClick={() => move(id, 1)}
                                className="rounded-lg p-1 hover:bg-gray-200 disabled:opacity-30"
                              >
                                <ArrowDown size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </fieldset>
                )}

                {/* Footer — Discard + Save */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Info size={12} aria-hidden="true" />
                    Modifications require co-organizer approval before broadcast.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDiscard}
                      disabled={loading}
                    >
                      Discard Changes
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canSave}
                      loading={loading}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} aria-hidden="true" />
                      Save
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT — status panel */}
          <div className="space-y-4">
            {/* Current Cycle Status */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Current Cycle Status
                </p>
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Live
                </span>
              </div>
              {/* Circular progress */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#e0e0e0" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#1b5e20"
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - 9 / 12)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-base font-bold text-text leading-tight">9</p>
                    <p className="text-[9px] text-text-secondary">/ 12</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Cycle Pot Target</p>
                  <p className="text-lg font-bold text-text">
                    R{cyclePotTarget > 0 ? cyclePotTarget.toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : "18,000.00"}
                  </p>
                  <p className="text-xs text-text-secondary">75% of full cycle fulfilled</p>
                </div>
              </div>
              {/* Beneficiary */}
              <div className="mt-3 rounded-xl bg-warning/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-warning">
                  Round 9 Beneficiary
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                    LK
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">Lerato Khumalo</p>
                    <p className="text-xs text-text-secondary">Disbursement due 1st prox.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NASASA Compliance */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-bold text-text">NASASA Compliance</p>
                  <p className="flex items-center gap-1 text-xs font-semibold text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Verified Chapter 4 Pool
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Operating under the South African National Stokvel Association (NASASA) regulatory
                    framework. Constitution modifications mandate a{" "}
                    <span className="font-semibold">7-day advance notice window</span> prior to ledger
                    ratification.
                  </p>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                    <span className="font-semibold text-text-secondary">Constitution Hash</span>
                    <span className="font-mono text-text-secondary">sha256-a9f8...12d</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Sig Governance */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="font-bold text-text">Multi-Sig Governance</p>
              <p className="text-xs text-text-secondary">2-of-2 Signature Rule</p>
              <p className="mt-1 text-xs text-text-secondary">
                Critical parameter modifications (payout amount, rotation sequence, dissolution)
                require digital co-authorization by both registered primary trustees.
              </p>
              <div className="mt-3 space-y-1.5">
                {[
                  { initials: "ND", name: "Nomsa Dlamini (You)", status: "Active", cls: "bg-success/10 text-success" },
                  { initials: "SN", name: "Sisanda Ndlovu", status: "Co-Signer", cls: "bg-gray-100 text-text-secondary" },
                ].map((signer) => (
                  <div
                    key={signer.name}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {signer.initials}
                      </div>
                      <span className="text-sm font-medium text-text">{signer.name}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${signer.cls}`}>
                      {signer.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enforceable Constitution */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Scale size={20} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
                <div>
                  <p className="font-bold text-text">Enforceable Constitution</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Signatures legally registered under South African Friendly Societies Act 25.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone — full width below the 2-col grid */}
        <div className="mt-6 rounded-2xl border border-error/30 bg-error/5 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-error">Danger Zone</h3>
                <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-white">
                  IRREVERSIBLE
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                Permanently disband this stokvel group and archive immutable ledger records. Active
                balances and rotational obligations must be fully reconciled before dissolution can
                proceed. Requires{" "}
                <span className="font-bold text-text">100% member consensus</span> and dual multi-sig
                sign-off.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {!confirmingDelete ? (
              <Button
                variant="destructive"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} aria-hidden="true" />
                delete group
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-error/30 bg-surface p-3.5">
                <p role="alert" className="text-sm text-error">
                  {MESSAGES.deleteGroupConfirm(stokvel.name)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    {MESSAGES.cancelButton}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    loading={loading}
                    onClick={onDelete}
                  >
                    {MESSAGES.deleteGroupButton}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

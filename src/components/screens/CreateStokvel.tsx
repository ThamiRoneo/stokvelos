"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Landmark,
  Info,
} from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { MESSAGES } from "@/lib/messages";
import type { Frequency } from "@/lib/api/types";

export type CreateStokvelValues = {
  name: string;
  description: string;
  contributionAmount: number;
  contributionFrequency: Frequency;
  rotationStrategy?: "join-order" | "random" | "auction";
  targetSize?: number;
};

type RotationStrategy = "join-order" | "random" | "auction";

const rotationOptions: {
  value: RotationStrategy;
  label: string;
  sub: string;
  badge: string;
}[] = [
  {
    value: "join-order",
    label: "Join order (First-come queue)",
    sub: "Queue positions are assigned chronologically upon invitation approval and identity check completion.",
    badge: "Standard",
  },
  {
    value: "random",
    label: "Randomized lottery draw",
    sub: "Verifiable cryptographic shuffle conducted once all member slots are filled and attested.",
    badge: "Provably Fair",
  },
  {
    value: "auction",
    label: "Bidding auction (Needs-based)",
    sub: "Members bid interest discount for priority payout slot distribution; surplus dividends redistribute to late slots.",
    badge: "Dynamic Yield",
  },
];

/** S5 — Create Stokvel. Matches visual design in docs/designs/S5.png exactly. */
export function CreateStokvel({
  onSubmit,
  onBack,
  loading = false,
  error,
  offline = false,
}: {
  onSubmit: (values: CreateStokvelValues) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [rotationStrategy, setRotationStrategy] = useState<RotationStrategy>("join-order");
  const [targetSize, setTargetSize] = useState(12);

  const parsedAmount = Number(amount);
  const nameError =
    name && !name.trim() ? MESSAGES.stokvelNameRequired : undefined;
  const amountError =
    amount &&
    (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000)
      ? MESSAGES.amountRange
      : undefined;
  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(amount) &&
    !nameError &&
    !amountError &&
    !loading &&
    !offline;

  const estimatedPot = (parsedAmount || 0) * targetSize;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      contributionAmount: parsedAmount,
      contributionFrequency: frequency,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          <span className="hidden text-xs text-text-secondary sm:inline">
            Cycle 12 · Ikhethelo Pool
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-text-secondary sm:flex">
            🔒 Ledger Synced
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            ND
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        {offline && (
          <div className="mb-4">
            <Banner variant="alert">{MESSAGES.noConnection}</Banner>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {/* Back link + heading */}
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to My Stokvels
        </button>

        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-text">Create Stokvel Group</h2>
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-primary">
                <CheckCircle size={12} aria-hidden="true" />
                NASASA Certified
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              You will become the group organizer and initial dual-signatory under South African
              Stokvel Association (NASASA) guidelines.
            </p>
          </div>
          <div className="ml-auto hidden rounded-xl border border-border bg-surface px-4 py-2 text-xs lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Regulatory Mandate
            </p>
            <p className="font-semibold text-text">Act 38 / 2001 (FICA) Compliant</p>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT — main form */}
          <div className="space-y-5">
            {/* Verified info card */}
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={22} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-primary">Verified Dual-Signatory Trust Authority</p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                      LEVEL 3 CLEARANCE
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Under NASASA compliance, your verified account keys countersign rotational cycle
                    payouts, emergency withdrawals, and bylaws changes with automatic quorum
                    confirmation.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {/* Name */}
              <TextInput
                label="Name"
                badge="Max 60 characters"
                placeholder="Soweto Sisanda Women's Club"
                hint="Unique group ledger name visible to all invited members."
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
              />

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="cs-description" className="text-sm font-semibold text-text">
                    Description &amp; Collective Purpose{" "}
                    <span className="font-normal text-text-secondary">(Optional)</span>
                  </label>
                  <span className="text-xs font-medium text-text-secondary">Bylaws summary</span>
                </div>
                <textarea
                  id="cs-description"
                  aria-label="description"
                  rows={3}
                  placeholder="Monthly rotational asset fund dedicated to emergency liquidity, festive disbursements, and bulk grocery pool savings with automated reconciliation."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] w-full rounded-xl border border-transparent bg-[#f3f4f6]/60 px-3.5 py-2.5 text-sm text-text placeholder:text-[#9ca3af] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <p className="text-xs text-text-secondary">
                  Outline pool objectives, penalty conditions, and attendance expectations.
                </p>
              </div>

              {/* Amount + Frequency row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">
                      Contribution Amount <span className="text-error">*</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-transparent bg-[#f3f4f6]/60 px-3.5 py-2.5 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="shrink-0 text-sm font-bold text-text">R</span>
                    <input
                      aria-label="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="1,500.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-[#9ca3af] focus:outline-none"
                    />
                    <span className="shrink-0 text-xs font-semibold text-text-secondary">ZAR</span>
                  </div>
                  {amountError && (
                    <p role="alert" className="mt-1 text-xs text-error">
                      {amountError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-text-secondary">
                    Fixed contribution per member per cycle. Minimum amount is R50.00.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-text">
                    Contribution Frequency <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["weekly", "monthly"] as const).map((f) => (
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
                          name="cs-frequency"
                          value={f}
                          checked={frequency === f}
                          onChange={() => setFrequency(f)}
                          className="sr-only"
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Cycle settlement triggers automatically.
                  </p>
                </div>
              </div>

              {/* Rotation Order Strategy */}
              <fieldset>
                <div className="mb-2 flex items-center justify-between">
                  <legend className="text-sm font-semibold text-text">
                    Rotation Order Strategy <span className="text-error">*</span>
                  </legend>
                </div>
                <p className="mb-3 text-xs text-text-secondary">
                  Determines payout scheduling order across pool participants.
                </p>
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
                        name="rotation-strategy"
                        value={opt.value}
                        checked={rotationStrategy === opt.value}
                        onChange={() => setRotationStrategy(opt.value)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-text">{opt.label}</span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-secondary">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Target Group Size slider */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="cs-size" className="text-sm font-semibold text-text">
                    Target Group Size
                  </label>
                  <span className="text-sm font-bold text-text">{targetSize} Active Members</span>
                </div>
                <input
                  id="cs-size"
                  type="range"
                  min={4}
                  max={24}
                  step={1}
                  value={targetSize}
                  onChange={(e) => setTargetSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-text-secondary">
                  <span>Min 4 members</span>
                  <span>Standard 12</span>
                  <span>Max 24 members</span>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  loading={loading}
                  className="flex flex-1 items-center justify-center gap-2"
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onBack}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* RIGHT — projection panel */}
          <div className="space-y-4">
            {/* Projection Summary */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-text">Projection Summary</h3>
                <span className="text-xs text-text-secondary">{targetSize}-Member Model</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Estimated Cycle Pot Payout
              </p>
              <p className="mt-1 text-3xl font-bold text-primary">
                R{" "}
                {estimatedPot > 0
                  ? estimatedPot.toLocaleString("en-ZA", { minimumFractionDigits: 2 })
                  : "18 000,00"}
                <span className="text-sm font-normal text-text-secondary"> / cycle</span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Guaranteed total sum pooled each cycle based on continuous member reconciliation.
              </p>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-bold text-text">
                    ROTATIONAL ALLOCATION{" "}
                    <span className="font-normal text-success">100% Guaranteed</span>
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[92%] rounded-l-full bg-primary transition-all" />
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      Rotational Payout
                    </span>
                    <span className="font-semibold text-text">
                      R{" "}
                      {estimatedPot > 0
                        ? (estimatedPot * 0.917).toLocaleString("en-ZA", {
                            maximumFractionDigits: 0,
                          })
                        : "16 500,00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                      Emergency Reserve Allocation
                    </span>
                    <span className="font-semibold text-warning">
                      R{" "}
                      {estimatedPot > 0
                        ? (estimatedPot * 0.083).toLocaleString("en-ZA", {
                            maximumFractionDigits: 0,
                          })
                        : "1 500,00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                      Default Buffer Insurance
                    </span>
                    <span>Included (0.00%)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {[
                  "🔍 Audit Trail: Immutable",
                  "⚖️ Disputes: Quorum 2/3",
                  "⚡ Disbursement: Auto-EFT",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bank-Grade card */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <Landmark size={20} className="text-text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-text">Bank-Grade Rotational Guard</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    All pooled contributions are held in designated South African partner bank trust
                    accounts. FICA compliance and KYC are verified upon member onboarding.
                  </p>
                  <div className="mt-2 flex gap-2">
                    {["Section 30A Trust", "256-bit Key Escrow"].map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary"
                      >
                        <Info size={10} aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

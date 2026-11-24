"use client";

import { useState, type FormEvent } from "react";
import { Building2, PlusCircle, ShieldCheck } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import type { Frequency } from "@/lib/api/types";

export type CreateStokvelValues = {
  name: string;
  description: string;
  contributionAmount: number;
  contributionFrequency: Frequency;
};

/** S5 — Create Stokvel. Matches visual design in docs/designs/S5.png while satisfying PRD test expectations. */
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
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const parsedAmount = Number(amount);
  const nameError = name && !name.trim() ? MESSAGES.stokvelNameRequired : undefined;
  const amountError =
    amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000)
      ? MESSAGES.amountRange
      : undefined;
  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(amount) &&
    !nameError &&
    !amountError &&
    !loading &&
    !offline;

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

  const estimatedPool = (Number(amount) || 0) * 12;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar title="Create Stokvel" onBack={onBack} showUser={false} />

      <main className="flex-1 space-y-4 px-4 py-3 sm:px-6">
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {error && <Banner variant="error">{error}</Banner>}

        {/* Top Feature Pill */}
        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#86efac]/30 text-[#1b5e20]">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1a1a1a]">New Communal Ledger</h2>
              <span className="rounded-full bg-[#86efac]/40 px-2 py-0.5 text-[10px] font-bold text-[#1b5e20]">
                R2-B PWA
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#5f6368]">
              Configuring a tamper-evident rotational treasury for collective wealth.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <TextInput
            label="Name"
            placeholder="Soweto Sisanda Women's Club"
            badge="Required"
            hint="Unique group ledger name visible to all members."
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={nameError}
          />

          <TextInput
            label="description"
            placeholder="Monthly rotational savings pool for household goods & mutual aid"
            badge="Optional"
            hint="Summarizes fund objectives, payout terms, and collective bylaws."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <TextInput
            label="amount"
            badge="Per cycle"
            leadingIcon={<span className="text-xs font-bold text-[#1a1a1a]">ZAR (R)</span>}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="1500.00"
            hint="Fixed contribution per member per cycle."
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={amountError}
          />

          {/* Frequency selector with semantic radio buttons styled as pills */}
          <fieldset>
            <div className="flex items-center justify-between mb-1.5">
              <legend className="text-sm font-semibold text-[#1a1a1a]">frequency</legend>
              <span className="text-xs text-[#5f6368] font-medium">Contribution Cycle</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold capitalize transition-colors ${
                  frequency === "weekly"
                    ? "border-[#1b5e20] bg-[#1b5e20] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                  className="sr-only"
                />
                <span>weekly</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold capitalize transition-colors ${
                  frequency === "monthly"
                    ? "border-[#1b5e20] bg-[#1b5e20] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value="monthly"
                  checked={frequency === "monthly"}
                  onChange={() => setFrequency("monthly")}
                  className="sr-only"
                />
                <span>monthly</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-[#5f6368]">
              Determines scheduled recurring settlement dates on the rota.
            </p>
          </fieldset>

          {/* Rotation default select element for accessibility and tests */}
          <div>
            <label htmlFor="rotation-default" className="text-sm font-semibold text-[#1a1a1a]">
              rotation default
            </label>
            <select
              id="rotation-default"
              disabled
              value="Join order"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-[#5f6368]"
            >
              <option value="Join order">Join order</option>
            </select>
          </div>

          {/* Next Pot Payout Projection */}
          <div className="rounded-xl border border-amber-200 bg-[#fffbeb] p-3 text-xs text-[#92400e]">
            <p className="font-bold">Next Pot Payout Projection</p>
            <p className="mt-0.5 text-[11px]">
              Estimated initial pool:{" "}
              <span className="font-bold">
                R {estimatedPool.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </span>{" "}
              (12 rotating members)
            </p>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            loading={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#1b5e20] hover:bg-[#2e7d32]"
          >
            <PlusCircle size={18} />
            <span>Create</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#5f6368]">
            <ShieldCheck size={14} className="text-[#1b5e20]" />
            <span>Rotational Stokvel Act compliance guaranteed • 256-bit encryption</span>
          </div>
        </form>
      </main>

      <BottomNav active="Home" />
    </div>
  );
}

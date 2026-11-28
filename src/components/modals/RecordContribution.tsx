"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { MESSAGES } from "@/lib/messages";
import { validateContributionAmount, type RecordContributionInput } from "@/lib/api/contributions";

export function RecordContribution({
  open,
  stokvelId,
  stokvelName,
  members,
  periods,
  defaultAmount = 0,
  frequency = "monthly",
  currentPeriod,
  onClose,
  onSubmit,
  submitting = false,
  amountError,
  errorBanner,
}: {
  open: boolean;
  stokvelId: string;
  stokvelName?: string;
  members: { id: string; name: string; slot?: number }[];
  periods: string[];
  defaultAmount?: number;
  frequency?: "weekly" | "monthly";
  currentPeriod: string;
  onClose: () => void;
  onSubmit: (input: RecordContributionInput) => Promise<void>;
  submitting?: boolean;
  amountError?: string;
  errorBanner?: string;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [amount, setAmount] = useState(defaultAmount);
  const [period, setPeriod] = useState(currentPeriod);
  const [note, setNote] = useState("");
  const [localAmountError, setLocalAmountError] = useState<string | undefined>(amountError);

  if (!open) return null;

  const monthlyEquiv = frequency === "weekly" ? defaultAmount * 2 : defaultAmount;
  const displayAmountHint = `R${defaultAmount} ${frequency} / R${monthlyEquiv} monthly`;

  function handleAmountChange(value: number) {
    setAmount(value);
    const result = validateContributionAmount(value);
    setLocalAmountError(result.ok ? undefined : result.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateContributionAmount(amount);
    if (!result.ok) {
      setLocalAmountError(result.message);
      return;
    }
    setLocalAmountError(undefined);
    await onSubmit({
      stokvelId,
      memberId: selectedMemberId,
      amount,
      periodLabel: period,
      note: note.trim() || null,
    });
  }

  const displayedAmountError = amountError ?? localAmountError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-contribution-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2
              id="record-contribution-title"
              className="text-lg font-semibold text-text"
            >
              Record Contribution
            </h2>
            {stokvelName && (
              <p className="mt-0.5 text-xs text-text-secondary">
                {stokvelName} • Organizer Only
              </p>
            )}
            {!stokvelName && (
              <p className="mt-0.5 text-xs text-text-secondary">Organizer Only</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-text-secondary hover:bg-border/40 hover:text-text"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Error banner */}
          {errorBanner && (
            <Banner variant={errorBanner === MESSAGES.noConnection ? "alert" : "error"}>
              {errorBanner}
            </Banner>
          )}

          {/* Member field */}
          <div className="space-y-1">
            <label htmlFor="rc-member" className="block text-sm font-medium text-text">
              Member
            </label>
            <select
              id="rc-member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {members.map((m, idx) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Slot #{m.slot ?? idx + 1})
                </option>
              ))}
            </select>
          </div>

          {/* Amount field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="rc-amount" className="block text-sm font-medium text-text">
                Amount
              </label>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                {displayAmountHint}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                R
              </span>
              <input
                id="rc-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                aria-label="Amount"
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-7 pr-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {displayedAmountError && (
              <p className="text-xs text-error">{displayedAmountError}</p>
            )}
          </div>

          {/* Period field */}
          <div className="space-y-1">
            <label htmlFor="rc-period" className="block text-sm font-medium text-text">
              Period
            </label>
            <select
              id="rc-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Note field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="rc-note" className="block text-sm font-medium text-text">
                Note
              </label>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                Optional
              </span>
            </div>
            <textarea
              id="rc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="EFT payment Ref #EFT-9942"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              aria-label="Record Contribution"
              loading={submitting}
              disabled={submitting}
            >
              <span>Record </span><span>Contribution</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

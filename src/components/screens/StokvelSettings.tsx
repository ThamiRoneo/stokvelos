"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Banner } from "@/components/Banner";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import type { Frequency, Member, Stokvel } from "@/lib/api/types";

export type StokvelSettingsValues = {
  name: string;
  contributionAmount: number;
  contributionFrequency: Frequency;
  rotationOrder: string[];
};

/** S12 — Stokvel Settings. Fields only from PRD §8.1: Name, amount, frequency, rotation. */
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
  const [amount, setAmount] = useState(String(stokvel.contributionAmount));
  const [frequency, setFrequency] = useState<Frequency>(stokvel.contributionFrequency);
  const initialOrder =
    stokvel.rotationOrder.length > 0
      ? stokvel.rotationOrder
      : members.map((member) => member.id);
  const [rotationOrder, setRotationOrder] = useState<string[]>(initialOrder);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const parsedAmount = Number(amount);
  const nameError = !name.trim() ? MESSAGES.stokvelNameRequired : undefined;
  const amountError =
    !amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000
      ? MESSAGES.amountRange
      : undefined;
  const canSave = !nameError && !amountError && !loading && !offline;

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

  function memberFor(id: string): Member | undefined {
    return members.find((member) => member.id === id);
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <TopAppBar title="Stokvel Settings" onBack={onBack} />
        <main className="flex-1 space-y-3 p-4">
          {error && <Banner variant="error">{error}</Banner>}
          {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
          {successBanner && <Banner variant="success">{successBanner}</Banner>}

          <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
            <TextInput
              label="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={amountError}
            />

            <fieldset>
              <legend className="mb-1 text-sm font-medium">frequency</legend>
              <div className="flex gap-4">
                {(["weekly", "monthly"] as Frequency[]).map((option) => (
                  <label key={option} className="flex min-h-touch items-center gap-2 text-sm capitalize">
                    <input
                      type="radio"
                      name="frequency"
                      value={option}
                      checked={frequency === option}
                      onChange={() => setFrequency(option)}
                      className="h-5 w-5 accent-primary"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-sm font-medium">rotation</legend>
              <ol className="space-y-1">
                {rotationOrder.map((id, index) => {
                  const member = memberFor(id);
                  return (
                    <li key={id} className="flex min-h-touch items-center justify-between gap-2 rounded-lg border border-border px-3 text-sm">
                      <span>{`${index + 1}. ${member?.fullName ?? "Member"}`}</span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${member?.fullName ?? "Member"} up`}
                          disabled={index === 0}
                          onClick={() => move(id, -1)}
                          className="min-h-touch rounded px-2 text-text-secondary disabled:text-disabled"
                        >
                          <ArrowUp size={20} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${member?.fullName ?? "Member"} down`}
                          disabled={index === rotationOrder.length - 1}
                          onClick={() => move(id, 1)}
                          className="min-h-touch rounded px-2 text-text-secondary disabled:text-disabled"
                        >
                          <ArrowDown size={20} aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </fieldset>

            <Button type="submit" disabled={!canSave} loading={loading} className="w-full">
              Save
            </Button>
          </form>

          <div className="rounded-xl border border-error bg-surface p-5">
            {confirmingDelete ? (
              <div className="space-y-3">
                <p role="alert" className="text-sm">{MESSAGES.deleteGroupConfirm(stokvel.name)}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                    {MESSAGES.cancelButton}
                  </Button>
                  <Button variant="destructive" onClick={onDelete}>
                    {MESSAGES.deleteGroupButton}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
                delete group
              </Button>
            )}
          </div>
        </main>
      </div>
      <BottomNav active="Profile" stokvelId={stokvel.id} />
    </div>
  );
}

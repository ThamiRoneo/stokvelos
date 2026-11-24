"use client";

import { useState, type FormEvent } from "react";
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

/** S5 — Create Stokvel, with inline validation (PRD §8.1 states). */
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

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <TopAppBar title="Create Stokvel" onBack={onBack} />
        <main className="flex-1 p-4">
          {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
          {error && (
            <div className="mt-3">
              <Banner variant="error">{error}</Banner>
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-5">
            <TextInput
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={nameError}
            />
            <TextInput
              label="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <TextInput
              label="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
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

            <div>
              <label htmlFor="rotation-default" className="mb-1 block">rotation default</label>
              <select
                id="rotation-default"
                disabled
                className="min-h-touch w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-secondary"
              >
                <option>Join order</option>
              </select>
            </div>

            <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full">
              Create
            </Button>
          </form>
        </main>
      </div>
      <BottomNav active="Home" />
    </div>
  );
}

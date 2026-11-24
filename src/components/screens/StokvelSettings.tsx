"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, AlertTriangle, Save, Check, ShieldCheck, Trash2 } from "lucide-react";
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

/** S12 — Stokvel Settings. Matches visual design in docs/designs/S12.png while satisfying PRD requirements. */
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
  const [rotationStrategy, setRotationStrategy] = useState<"fixed" | "random" | "auction">("fixed");
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar title="Stokvel Settings" onBack={onBack} showUser={false} />

      <main className="flex-1 space-y-4 px-4 py-3 sm:px-6">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {successBanner && <Banner variant="success">{successBanner}</Banner>}

        {/* Top Header Pill */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#5f6368]">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1b5e20] text-[10px] font-bold text-white">
              R2
            </span>
            <span>CLUB LEDGER CONFIG • PWA SYNC</span>
          </div>
          <div className="flex items-center gap-1 text-[#1b5e20]">
            <span className="h-2 w-2 rounded-full bg-[#1b5e20]" />
            <span>15 Members Active</span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <TextInput
            label="Name"
            badge="Legal Title"
            hint="Stokvel legal or informal group name."
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
          />

          <TextInput
            label="amount"
            badge="Per Member Rotation"
            leadingIcon={<span className="text-sm font-bold text-[#1b5e20]">R</span>}
            type="number"
            min="0.01"
            step="0.01"
            hint="Amount must be between R0.01 and R1,000,000. (PRD §6.2 rule)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-colors ${
                  frequency === "weekly"
                    ? "border-[#1b5e20] bg-[#1b5e20] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="settings-frequency"
                  value="weekly"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                  className="sr-only"
                />
                {frequency === "weekly" && <Check size={14} />}
                <span>weekly</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-colors ${
                  frequency === "monthly"
                    ? "border-[#1b5e20] bg-[#1b5e20] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="settings-frequency"
                  value="monthly"
                  checked={frequency === "monthly"}
                  onChange={() => setFrequency("monthly")}
                  className="sr-only"
                />
                {frequency === "monthly" && <Check size={14} />}
                <span>monthly</span>
              </label>
            </div>
          </fieldset>

          {/* Rotation Strategy Options from S12 */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1a1a1a]">Rotation Strategy</label>
              <span className="text-xs font-semibold text-[#1b5e20]">PRD §4.4</span>
            </div>
            <p className="text-xs text-[#5f6368]">Slot assignment rule across 15 active members.</p>

            <div className="mt-2 space-y-2">
              <div
                onClick={() => setRotationStrategy("fixed")}
                className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                  rotationStrategy === "fixed"
                    ? "border-[#1b5e20] bg-green-50/20"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1b5e20] text-white">
                      <Check size={12} />
                    </span>
                    <span className="text-xs font-bold text-[#1a1a1a]">Fixed order</span>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-[#1b5e20]">
                    Active Roster
                  </span>
                </div>
                <p className="mt-1 pl-7 text-[11px] text-[#5f6368]">
                  Sequential hand-off based on joining schedule and vetted rank.
                </p>
              </div>
            </div>
          </div>

          {/* Member Roster reordering controls */}
          {members.length > 0 && (
            <fieldset>
              <legend className="mb-1 text-sm font-medium">rotation</legend>
              <ol className="mt-2 space-y-2">
                {rotationOrder.map((id, index) => {
                  const member = memberFor(id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 text-xs"
                    >
                      <span className="font-medium text-[#1a1a1a]">
                        {`${index + 1}. ${member?.fullName ?? "Member"}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${member?.fullName ?? "Member"} up`}
                          disabled={index === 0}
                          onClick={() => move(id, -1)}
                          className="rounded-lg p-1 hover:bg-gray-200 disabled:opacity-30"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${member?.fullName ?? "Member"} down`}
                          disabled={index === rotationOrder.length - 1}
                          onClick={() => move(id, 1)}
                          className="rounded-lg p-1 hover:bg-gray-200 disabled:opacity-30"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </fieldset>
          )}

          <Button
            type="submit"
            disabled={!canSave}
            loading={loading}
            className="flex w-full items-center justify-center gap-2 bg-[#1b5e20] hover:bg-[#2e7d32]"
          >
            <Save size={16} />
            <span>Save</span>
          </Button>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#5f6368]">
            <ShieldCheck size={14} className="text-[#1b5e20]" />
            <span>Updates trigger digital consensus across member ledger copies.</span>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#c62828]">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#c62828]">Danger Zone</h3>
              <p className="mt-1 text-xs text-[#5f6368]">
                Permanently disband this stokvel group and archive immutable ledger records. Active balances must be fully distributed before dissolution.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {!confirmingDelete ? (
              <Button
                variant="ghost"
                onClick={() => setConfirmingDelete(true)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#c62828] text-xs font-semibold text-white shadow-xs hover:bg-red-700"
              >
                <Trash2 size={16} />
                <span>delete group</span>
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-red-200 bg-white p-3.5">
                <p role="alert" className="text-xs text-[#c62828]">
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

      <BottomNav active="Profile" stokvelId={stokvel.id} />
    </div>
  );
}

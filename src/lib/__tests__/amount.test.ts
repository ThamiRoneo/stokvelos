import { describe, expect, it } from "vitest";
import { validateContributionAmount } from "@/lib/api/contributions";
import { validatePayoutAmount } from "@/lib/api/payouts";
import { MESSAGES } from "@/lib/messages";

/** Exact BR5 copy from supabase/migrations/0003_functions.sql (check_payout_amount). */
const PAYOUT_AMOUNT_COPY = "Payout amount must be between R0.01 and R10,000,000.";

describe("T-BR4-1 validateContributionAmount", () => {
  it.each([0.01, 250, 1_000_000])("accepts R%s", (amount) => {
    expect(validateContributionAmount(amount)).toEqual({ ok: true, data: true });
  });

  it.each([0, -0.01, 1_000_000.01, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s with the exact BR4 copy",
    (amount) => {
      expect(validateContributionAmount(amount)).toEqual({
        ok: false,
        message: MESSAGES.amountRange,
      });
    },
  );
});

describe("T-BR5-1 validatePayoutAmount", () => {
  it.each([0.01, 3750, 10_000_000])("accepts R%s", (amount) => {
    expect(validatePayoutAmount(amount)).toEqual({ ok: true, data: true });
  });

  it.each([0, 10_000_000.01, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s with the exact BR5 copy",
    (amount) => {
      expect(validatePayoutAmount(amount)).toEqual({
        ok: false,
        message: PAYOUT_AMOUNT_COPY,
      });
    },
  );
});

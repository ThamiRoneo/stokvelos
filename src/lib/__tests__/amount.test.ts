import { describe, expect, it } from "vitest";
import { validateContributionAmount } from "@/lib/api/contributions";
import { MESSAGES } from "@/lib/messages";

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

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContributionsLedger } from "@/components/screens/ContributionsLedger";
import type { LedgerData } from "@/lib/api/contributions";

const nomsa = { id: "m1", name: "Nomsa Dlamini" };

const ledgerData: LedgerData = {
  rows: [
    {
      id: "c1",
      stokvelId: "aaaaaaaa-0000-0000-0000-000000000001",
      memberId: "m1",
      memberName: "Nomsa Dlamini",
      amount: 250,
      periodLabel: "2026-01",
      note: null,
      recordedAt: "2026-01-15T10:00:00.000Z",
    },
  ],
  totals: { total: 250 },
  periods: ["2026-01"],
  members: [nomsa],
};

const baseProps = {
  stokvelId: "aaaaaaaa-0000-0000-0000-000000000001",
  ledger: ledgerData,
};

describe("T-S8-1 ContributionsLedger (S8)", () => {
  it("renders heading, reconciled badge, member name, formatted amount, totals row and Record button for organizer", () => {
    render(<ContributionsLedger {...baseProps} isOrganizer />);

    expect(screen.getByText(/Contributions Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Reconciled Ledger/i)).toBeInTheDocument();

    expect(screen.getByText("Nomsa Dlamini")).toBeInTheDocument();
    expect(screen.getByText("R250.00")).toBeInTheDocument();

    expect(screen.getByText(/Period Ledger Totals/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Record Contribution/i }),
    ).toBeInTheDocument();
  });

  it("hides the Record Contribution button for a non-organizer", () => {
    render(<ContributionsLedger {...baseProps} isOrganizer={false} />);
    expect(
      screen.queryByRole("button", { name: /Record Contribution/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty state when there are no contributions", () => {
    const emptyLedger: LedgerData = {
      rows: [],
      totals: { total: 0 },
      periods: [],
      members: [],
    };
    render(<ContributionsLedger stokvelId={baseProps.stokvelId} ledger={emptyLedger} />);
    expect(
      screen.getByText("No contributions yet. Record the first one."),
    ).toBeInTheDocument();
  });

  it("shows a Spinner when loading", () => {
    render(<ContributionsLedger {...baseProps} loading />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows an error banner when error is provided", () => {
    render(<ContributionsLedger {...baseProps} error="Couldn't load. Try again." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load. Try again.");
  });

  it("shows a success banner when successBanner is provided", () => {
    render(
      <ContributionsLedger
        {...baseProps}
        successBanner="Contribution recorded."
      />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Contribution recorded.");
  });
});

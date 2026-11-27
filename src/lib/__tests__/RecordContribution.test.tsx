import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordContribution } from "@/components/modals/RecordContribution";
import { MESSAGES } from "@/lib/messages";

const members = [
  { id: "m1", name: "Nomsa Dlamini" },
  { id: "m2", name: "Sipho Nkosi" },
];

const periods = ["2026-01", "2026-02"];

const baseProps = {
  open: true,
  members,
  periods,
  currentPeriod: "2026-01",
  defaultAmount: 250,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
};

describe("T-M1-1 RecordContribution modal (M1)", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <RecordContribution {...baseProps} open={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders dialog with required fields and buttons when open", () => {
    render(<RecordContribution {...baseProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    expect(screen.getByText(/Record Contribution/i)).toBeInTheDocument();
    expect(screen.getByText(/Organizer Only/i)).toBeInTheDocument();

    // Member field
    expect(screen.getByLabelText(/Member/i)).toBeInTheDocument();

    // Amount field pre-filled
    const amountInput = screen.getByLabelText(/Amount/i);
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveValue(250);

    // Period select defaults to currentPeriod
    const periodSelect = screen.getByLabelText(/Period/i);
    expect(periodSelect).toBeInTheDocument();
    expect(periodSelect).toHaveValue("2026-01");

    // Note textarea
    expect(screen.getByLabelText(/Note/i)).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Record Contribution/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state on submit button when submitting", () => {
    render(<RecordContribution {...baseProps} submitting />);
    const submitBtn = screen.getByRole("button", { name: /Record Contribution/i });
    // Either aria-busy=true or disabled
    const isBusy =
      submitBtn.getAttribute("aria-busy") === "true" ||
      submitBtn.hasAttribute("disabled");
    expect(isBusy).toBe(true);
    // Spinner inside button
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows inline amount validation error", () => {
    render(<RecordContribution {...baseProps} amountError={MESSAGES.amountRange} />);
    expect(
      screen.getByText("Amount must be between R0.01 and R1,000,000."),
    ).toBeInTheDocument();
  });

  it("shows duplicate contribution banner", () => {
    const dupMsg = MESSAGES.duplicateContribution("Nomsa Dlamini", "2026-01");
    render(<RecordContribution {...baseProps} errorBanner={dupMsg} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(dupMsg);
  });

  it("shows offline error banner", () => {
    render(<RecordContribution {...baseProps} errorBanner={MESSAGES.noConnection} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("No connection.");
  });

  it("calls onClose when ✕ button is clicked", () => {
    const onClose = vi.fn();
    render(<RecordContribution {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Close|✕|×/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<RecordContribution {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

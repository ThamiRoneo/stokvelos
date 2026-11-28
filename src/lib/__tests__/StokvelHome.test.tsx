import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StokvelHome } from "@/components/screens/StokvelHome";

const baseProps = {
  stokvelId: "aaaaaaaa-0000-0000-0000-000000000001",
  stokvelName: "Soweto Savers",
};

describe("T-S7-1 StokvelHome (S7)", () => {
  it("renders stokvel name, breadcrumb, stats, hub heading, operation cards and recent activity", () => {
    render(<StokvelHome {...baseProps} />);

    // Stokvel name appears
    expect(screen.getByText("Soweto Savers")).toBeInTheDocument();

    // Breadcrumb back to /stokvels
    const backLink = screen.getByRole("link", { name: /Back to My Stokvels/i });
    expect(backLink).toHaveAttribute("href", "/stokvels");

    // Stat section labels
    expect(screen.getByText(/Managed Vault Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled Payout/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Reserve/i)).toBeInTheDocument();

    // Hub heading
    expect(screen.getByText(/Stokvel Operations Hub/i)).toBeInTheDocument();

    // Operation cards / CTA links
    const ledgerLink = screen.getByRole("link", { name: /Contributions Ledger/i });
    expect(ledgerLink).toHaveAttribute(
      "href",
      `/stokvels/${baseProps.stokvelId}/ledger`,
    );

    const payoutsLink = screen.getByRole("link", { name: /Payouts/i });
    expect(payoutsLink).toHaveAttribute(
      "href",
      `/stokvels/${baseProps.stokvelId}/payouts`,
    );

    const membersLink = screen.getByRole("link", { name: /Members/i });
    expect(membersLink).toHaveAttribute(
      "href",
      `/stokvels/${baseProps.stokvelId}/members`,
    );

    const auditLink = screen.getByRole("link", { name: /Audit/i });
    expect(auditLink).toHaveAttribute(
      "href",
      `/stokvels/${baseProps.stokvelId}/audit`,
    );

    // Recent Verified Activity heading
    expect(screen.getByText(/Recent Verified Activity/i)).toBeInTheDocument();
  });

  it("shows a Spinner when loading", () => {
    render(<StokvelHome {...baseProps} loading />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows an error banner and no stat cards when error is provided", () => {
    render(<StokvelHome {...baseProps} error="Couldn't load. Try again." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load. Try again.");
    // No stat cards rendered in error state
    expect(screen.queryByText(/Managed Vault Balance/i)).not.toBeInTheDocument();
  });
});

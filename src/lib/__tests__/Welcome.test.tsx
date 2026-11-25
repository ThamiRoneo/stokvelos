import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Welcome } from "@/components/screens/Welcome";

describe("T-S1-1 Welcome (S1)", () => {
  it("renders the logo lock-up, PRD pitch, status row, auth links, and footer caption", () => {
    render(<Welcome />);

    expect(screen.getByRole("img", { name: "StokvelOS refined ledger logo" })).toBeInTheDocument();
    expect(screen.getByText("COLLECTIVE WEALTH PROTOCOL")).toBeInTheDocument();

    expect(
      screen.getByText(
        "StokvelOS gives stokvels a shared, tamper-evident ledger and payout scheduler, so every member always knows where their money is.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Consensus Layer")).toBeInTheDocument();
    expect(screen.getByText("Dual-Audited Rotation Engine")).toBeInTheDocument();
    expect(screen.getByText("Live Verifier")).toBeInTheDocument();

    const signUp = screen.getByRole("link", { name: "Sign up" });
    expect(signUp).toHaveAttribute("href", "/sign-up");
    expect(signUp).toHaveClass("w-full");

    const logIn = screen.getByRole("link", { name: "Log in" });
    expect(logIn).toHaveAttribute("href", "/log-in");
    expect(logIn).toHaveClass("w-full");

    expect(screen.getByText("End-to-End Cryptographic Ledger")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Engineered for rotational credit unions, burial societies, and investment pools.",
      ),
    ).toBeInTheDocument();
  });
});

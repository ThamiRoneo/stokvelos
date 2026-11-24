import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyStokvels } from "@/components/screens/MyStokvels";
import type { Stokvel } from "@/lib/api/types";

const savers: Stokvel = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Soweto Savers",
  description: null,
  contributionAmount: 250,
  contributionFrequency: "weekly",
  rotationOrder: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("T-S4-1 My Stokvels (S4)", () => {
  it("T-US2-1 shows the exact empty state with Create and Join CTAs", () => {
    render(<MyStokvels stokvels={[]} />);
    expect(
      screen.getByText("You're not in any stokvel yet. Create one or join with a link."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute("href", "/stokvels/new");
    expect(screen.getByRole("link", { name: "join with a link" })).toHaveAttribute("href", "/join");
  });

  it("shows stokvel cards with name, member count and amount", () => {
    render(<MyStokvels stokvels={[savers]} memberCounts={{ [savers.id]: 15 }} />);
    expect(screen.getByText("Soweto Savers")).toBeInTheDocument();
    expect(screen.getByText("15 members")).toBeInTheDocument();
    expect(screen.getByText("R250/week")).toBeInTheDocument();
  });

  it("shows the exact load error", () => {
    render(<MyStokvels stokvels={[]} error="Couldn't load. Try again." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load. Try again.");
  });

  it("shows offline and staleness banners for cached data", () => {
    render(<MyStokvels stokvels={[savers]} offline cachedAt="2020-01-01T00:00:00.000Z" />);
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    expect(screen.getByText(/May be out of date\./)).toBeInTheDocument();
  });

  it("shows a loading indicator", () => {
    render(<MyStokvels stokvels={[]} loading />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});

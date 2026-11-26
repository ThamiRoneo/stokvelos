import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StokvelSettings } from "@/components/screens/StokvelSettings";
import type { Member, Stokvel } from "@/lib/api/types";

const stokvel: Stokvel = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Soweto Savers",
  description: null,
  contributionAmount: 250,
  contributionFrequency: "weekly",
  rotationOrder: ["m1", "m2"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const members: Member[] = [
  {
    id: "m1",
    userId: "11111111-1111-1111-1111-111111111111",
    fullName: "Nomsa Dlamini",
    role: "organizer",
    status: "active",
    joinedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "m2",
    userId: "22222222-2222-2222-2222-222222222222",
    fullName: "Sipho Nkosi",
    role: "member",
    status: "active",
    joinedAt: "2026-02-01T00:00:00.000Z",
  },
];

const base = { onSave: vi.fn(), onDelete: vi.fn() };

describe("T-S12-1 Stokvel Settings (S12)", () => {
  it("shows only the PRD fields: Name, amount, frequency, rotation", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("amount")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "weekly" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "monthly" })).toBeInTheDocument();
    expect(screen.queryByLabelText("description")).not.toBeInTheDocument();
  });

  it("renders rotation as numbered rows with accessible up/down buttons", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} />);
    expect(screen.getByText("1. Nomsa Dlamini")).toBeInTheDocument();
    expect(screen.getByText("2. Sipho Nkosi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move Nomsa Dlamini down" })).toBeInTheDocument();
  });

  it("pre-fills the form and saves the edited values with the new order", () => {
    const onSave = vi.fn();
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Soweto Uplift" } });
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("radio", { name: "monthly" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Nomsa Dlamini down" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      name: "Soweto Uplift",
      contributionAmount: 500,
      contributionFrequency: "monthly",
      rotationOrder: ["m2", "m1"],
    });
  });

  it("shows the exact saved banner", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} successBanner="Saved." />);
    expect(screen.getAllByText("Saved.").length).toBeGreaterThan(0);
  });

  it("shows the exact validation messages", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    expect(screen.getAllByText("Enter a stokvel name.").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "0" } });
    expect(screen.getAllByText("Amount must be between R0.01 and R1,000,000.").length).toBeGreaterThan(0);
  });

  it("T-S12-2 shows the exact delete confirmation with Cancel / Delete stokvel", () => {
    const onDelete = vi.fn();
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "delete group" }));
    expect(
      screen.getByText(
        "Delete Soweto Savers? All contributions, payouts and disputes will be removed. This cannot be undone.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByText(
        "Delete Soweto Savers? All contributions, payouts and disputes will be removed. This cannot be undone.",
      ),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "delete group" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete stokvel" }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows the offline banner and disables Save", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} offline />);
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("renders without an inline AppNav (nav is provided by the layout)", () => {
    render(<StokvelSettings stokvel={stokvel} members={members} {...base} />);
    // AppNav is provided by (app)/layout.tsx; the screen component must not render a second one
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    // The save action must still be present
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});

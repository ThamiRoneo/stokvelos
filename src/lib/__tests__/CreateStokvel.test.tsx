import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateStokvel } from "@/components/screens/CreateStokvel";

const noop = vi.fn();

function renderCreate(props: Partial<Parameters<typeof CreateStokvel>[0]> = {}) {
  return render(<CreateStokvel onSubmit={noop} {...props} />);
}

describe("T-S5-1 / T-US4-1 Create Stokvel (S5)", () => {
  it("shows the exact inline validation messages from Stitch decision 6", () => {
    renderCreate();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    expect(screen.getAllByText("Enter a stokvel name.").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "0" } });
    expect(screen.getAllByText("Amount must be between R0.01 and R1,000,000.").length).toBeGreaterThan(0);
  });

  it("T-US4-1 submits name, description, amount and frequency", () => {
    const onSubmit = vi.fn();
    renderCreate({ onSubmit });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Soweto Savers" } });
    fireEvent.change(screen.getByLabelText("description"), { target: { value: "Weekly savings" } });
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "250" } });
    fireEvent.click(screen.getByRole("radio", { name: "monthly" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Soweto Savers",
      description: "Weekly savings",
      contributionAmount: 250,
      contributionFrequency: "monthly",
    });
  });

  it("T-S5-1 shows the offline banner and disables Create", () => {
    renderCreate({ offline: true });
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows BottomNav with Home active in the stokvels flow", () => {
    renderCreate();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });
});

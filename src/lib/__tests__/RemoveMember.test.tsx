import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RemoveMember } from "@/components/modals/RemoveMember";

const base = { open: true, memberName: "Sipho Nkosi", onConfirm: vi.fn(), onCancel: vi.fn() };

describe("T-M7-1 Remove Member (M7)", () => {
  it("shows the confirmation and calls onConfirm", () => {
    const onConfirm = vi.fn();
    render(<RemoveMember {...base} onConfirm={onConfirm} />);
    expect(screen.getByText(/Remove Sipho Nkosi/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("cancels without removing", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<RemoveMember {...base} onCancel={onCancel} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("T-M7-1 shows the exact BR7 blocked message", () => {
    render(
      <RemoveMember
        {...base}
        error="Cannot remove: Sipho Nkosi has an unpaid payout. Reassign first."
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot remove: Sipho Nkosi has an unpaid payout. Reassign first.",
    );
  });

  it("renders nothing when closed", () => {
    const { container } = render(<RemoveMember {...base} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

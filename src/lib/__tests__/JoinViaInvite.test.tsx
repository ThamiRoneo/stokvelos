import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JoinViaInvite } from "@/components/screens/JoinViaInvite";
import type { InvitePreview } from "@/lib/api/types";

const preview: InvitePreview = {
  stokvelId: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Soweto Savers",
  description: null,
  contributionAmount: 250,
  contributionFrequency: "weekly",
  memberCount: 15,
};

describe("T-S6-1 / T-US6-1 Join via Invite (S6)", () => {
  it("T-US6-1 shows the safe group preview and Join action", () => {
    const onJoin = vi.fn();
    render(<JoinViaInvite preview={preview} onJoin={onJoin} />);
    expect(screen.getByText("Soweto Savers")).toBeInTheDocument();
    expect(screen.getByText("15 members")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    expect(onJoin).toHaveBeenCalled();
  });

  it("T-S6-1 shows the exact expired and used invite messages", () => {
    const expired = "This invite has expired. Ask the organizer for a new link.";
    const { unmount } = render(<JoinViaInvite error={expired} onJoin={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(expired);
    unmount();
    render(<JoinViaInvite error="This invite has already been used." onJoin={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("This invite has already been used.");
  });

  it("T-S6-1 shows the generic join error and offline banner", () => {
    render(<JoinViaInvite error="Couldn't join. Try again." offline onJoin={vi.fn()} />);
    expect(screen.getAllByText("Couldn't join. Try again.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
  });

  it("shows a loading indicator", () => {
    render(<JoinViaInvite loading onJoin={vi.fn()} />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows BottomNav with Home active in the stokvels flow", () => {
    render(<JoinViaInvite preview={preview} onJoin={vi.fn()} />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });
});

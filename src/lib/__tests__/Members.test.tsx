import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Members } from "@/components/screens/Members";
import type { Member } from "@/lib/api/types";

const nomsa: Member = {
  id: "m1",
  userId: "11111111-1111-1111-1111-111111111111",
  fullName: "Nomsa Dlamini",
  role: "organizer",
  status: "active",
  joinedAt: "2026-01-01T00:00:00.000Z",
};
const sipho: Member = {
  id: "m2",
  userId: "22222222-2222-2222-2222-222222222222",
  fullName: "Sipho Nkosi",
  role: "member",
  status: "active",
  joinedAt: "2026-02-01T00:00:00.000Z",
};

const base = { onInvite: vi.fn(), onRemove: vi.fn() };

describe("T-S10-1 Members (S10)", () => {
  it("shows member rows with role badges and join dates", () => {
    render(<Members members={[nomsa, sipho]} {...base} />);
    expect(screen.getByText("Nomsa Dlamini")).toBeInTheDocument();
    expect(screen.getByText("Sipho Nkosi")).toBeInTheDocument();
    expect(screen.getAllByText("organizer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("member").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("time").length).toBe(2);
  });

  it("shows the exact empty state and the Invite action for an organizer", () => {
    render(<Members members={[]} canOrganize {...base} />);
    expect(screen.getByText("No members yet. Invite someone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("hides organizer actions for a plain member", () => {
    render(<Members members={[nomsa, sipho]} canOrganize={false} {...base} />);
    expect(screen.queryByRole("button", { name: "Invite" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("calls onRemove with the chosen member", () => {
    const onRemove = vi.fn();
    render(<Members members={[nomsa]} canOrganize onInvite={vi.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith(nomsa);
  });

  it("shows the exact load error, offline banner and success banner", () => {
    const { unmount } = render(<Members members={[]} error="Couldn't load. Try again." {...base} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load. Try again.");
    unmount();
    render(<Members members={[nomsa]} offline successBanner="Member joined." {...base} />);
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Member joined.").length).toBeGreaterThan(0);
  });
});

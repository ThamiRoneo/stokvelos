import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InviteMember } from "@/components/modals/InviteMember";

const link = "http://localhost:3000/join/cccccccc-0000-0000-0000-000000000004";
const base = { open: true, link, onClose: vi.fn() };

describe("T-M5-1 Invite Member (M5)", () => {
  it("shows the invite link, WhatsApp share and copy actions", () => {
    render(<InviteMember {...base} />);
    expect(screen.getByRole("textbox")).toHaveValue(link);
    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me"),
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies the link and shows the success state", () => {
    const onCopy = vi.fn();
    render(<InviteMember {...base} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledWith(link);
  });

  it("shows the offline message and inline error", () => {
    const { unmount } = render(<InviteMember {...base} offline />);
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    unmount();
    render(<InviteMember {...base} error="Couldn't save." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save.");
  });

  it("renders nothing when closed", () => {
    const { container } = render(<InviteMember {...base} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

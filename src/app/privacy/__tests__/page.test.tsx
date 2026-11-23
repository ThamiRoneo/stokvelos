import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "../page";

describe("PrivacyPolicy page", () => {
  it("names the controller, the governing law and all 12 sections", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    expect(
      screen.getByText(/Protection of Personal Information Act 4 of 2013/),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
  });

  it("publishes a working contact link for data-subject requests", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("link", { name: "stokvelos.support@gmail.com" }),
    ).toHaveAttribute("href", "mailto:stokvelos.support@gmail.com");
    expect(screen.getByText(/data-subject request or complaint/)).toBeVisible();
  });

  it("states session-only cookies, indefinite anonymised retention and POPIA rights", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/no analytics or advertising cookies/i)).toBeVisible();
    expect(screen.getByText(/retained indefinitely/i)).toBeVisible();
    expect(screen.getByText(/object to processing/i)).toBeVisible();
    expect(screen.getByText(/aged 18 or older/i)).toBeVisible();
  });
});

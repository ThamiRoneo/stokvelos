import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignUp } from "@/components/screens/SignUp";

const noop = vi.fn();

function renderSignUp(props: Partial<Parameters<typeof SignUp>[0]> = {}) {
  return render(<SignUp onSubmit={noop} onGoogle={noop} {...props} />);
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "nomsa@stokvelos.app" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "abcdefg1" },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "I confirm that I am 18 or older" }));
}

describe("T-US1-1 / T-S2-1 Sign Up (S2)", () => {
  it("T-S2-1 links the privacy checkbox to the in-app /privacy page", () => {
    renderSignUp();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("T-US1-1 keeps Register disabled until email, valid password and both consents", () => {
    renderSignUp();
    const register = screen.getByRole("button", { name: "Register" });
    expect(register).toBeDisabled();

    fillValidForm();
    expect(register).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /I accept the Privacy Policy/ }),
    );
    expect(register).toBeEnabled();
  });

  it("T-AUTH-1 shows the exact password rule as a red error on weak input", () => {
    renderSignUp();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "abcdefgh" } });
    expect(
      screen.getAllByText("At least 8 characters, including at least 1 number").length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
  });

  it("T-US1-1 submits the form values once valid", () => {
    const onSubmit = vi.fn();
    renderSignUp({ onSubmit });
    fillValidForm();
    fireEvent.click(screen.getByRole("checkbox", { name: /I accept the Privacy Policy/ }));
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "nomsa@stokvelos.app",
      password: "abcdefg1",
      acceptedAge: true,
      acceptedPrivacy: true,
    });
  });

  it("T-S2-1 shows the account-exists and offline messages exactly", () => {
    const { unmount } = renderSignUp({ error: "This email already has an account." });
    expect(screen.getByRole("alert")).toHaveTextContent("This email already has an account.");
    unmount();
    renderSignUp({ offline: true });
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
  });

  it("T-AUTH-2 keeps Google consent-gated and passes consent through", () => {
    const onGoogle = vi.fn();
    renderSignUp({ onGoogle });
    const google = screen.getByRole("button", { name: "Continue with Google" });
    expect(google).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "I confirm that I am 18 or older" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I accept the Privacy Policy/ }));
    expect(google).toBeEnabled();
    fireEvent.click(google);
    expect(onGoogle).toHaveBeenCalledWith({ acceptedAge: true, acceptedPrivacy: true });
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogIn } from "@/components/screens/LogIn";

const noop = vi.fn();

function renderLogIn(props: Partial<Parameters<typeof LogIn>[0]> = {}) {
  return render(<LogIn onSubmit={noop} onGoogle={noop} onReset={noop} {...props} />);
}

function fillForm() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nomsa@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "abcdefg1" } });
}

describe("T-US2-1 / T-S3-1 Log In (S3)", () => {
  it("T-US2-1 submits correct credentials", () => {
    const onSubmit = vi.fn();
    renderLogIn({ onSubmit });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: "nomsa@example.test",
      password: "abcdefg1",
    });
  });

  it("T-S3-1 shows the exact credential and verification errors", () => {
    const { rerender } = renderLogIn({ error: "Invalid credentials." });
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials.");
    rerender(<LogIn onSubmit={noop} onGoogle={noop} onReset={noop} error="Please verify email." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please verify email.");
  });

  it("T-S3-1 shows the offline message", () => {
    renderLogIn({ offline: true });
    expect(screen.getAllByText("No connection.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
  });

  it("C5 forgot password opens the inline reset form and confirms with exact copy", () => {
    const onReset = vi.fn();
    renderLogIn({ onReset });
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    const emailInputs = screen.getAllByLabelText("Email");
    fireEvent.change(emailInputs[1], { target: { value: "nomsa@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(onReset).toHaveBeenCalledWith("nomsa@example.test");
    expect(
      screen.getByText("If an account exists, a reset link has been sent."),
    ).toBeInTheDocument();
  });

  it("T-AUTH-2 Google button calls onGoogle", () => {
    const onGoogle = vi.fn();
    renderLogIn({ onGoogle });
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(onGoogle).toHaveBeenCalled();
  });
});

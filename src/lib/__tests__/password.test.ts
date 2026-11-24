import { describe, it, expect } from "vitest";
import { isValidPassword, isValidEmail } from "../password";

describe("T-AUTH-1 password rules (PRD §5)", () => {
  it("accepts 8 characters with at least one number", () => {
    expect(isValidPassword("abcdefg1")).toBe(true);
  });

  it("rejects 8 characters with no number", () => {
    expect(isValidPassword("abcdefgh")).toBe(false);
  });

  it("rejects a short password that does contain a number", () => {
    expect(isValidPassword("abc1")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidPassword("")).toBe(false);
  });
});

describe("email validation", () => {
  it("accepts a simple address and trims whitespace", () => {
    expect(isValidEmail(" nomsa@example.test ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("nomsa")).toBe(false);
    expect(isValidEmail("nomsa@")).toBe(false);
  });
});

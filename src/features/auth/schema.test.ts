import { describe, expect, it } from "vitest";
import { logInInput, newPasswordInput, safeNext, signUpInput } from "./schema";

describe("signUpInput", () => {
  it("trims and lowercases the email", () => {
    const parsed = signUpInput.parse({
      email: "  Anna@Example.COM ",
      password: "long enough",
      terms: "on",
    });
    expect(parsed.email).toBe("anna@example.com");
  });

  it("refuses an invalid email", () => {
    expect(
      signUpInput.safeParse({
        email: "anna",
        password: "long enough",
        terms: "on",
      }).success,
    ).toBe(false);
  });

  it("refuses a password under 8 characters", () => {
    expect(
      signUpInput.safeParse({ email: "a@b.co", password: "short", terms: "on" })
        .success,
    ).toBe(false);
  });

  it("refuses a sign-up without the terms accepted", () => {
    const result = signUpInput.safeParse({
      email: "a@b.co",
      password: "long enough",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Accept the terms to create an account",
    );
  });

  it("refuses a password over 72 characters", () => {
    expect(
      newPasswordInput.safeParse({ password: "a".repeat(73) }).success,
    ).toBe(false);
  });
});

describe("logInInput", () => {
  it("accepts any non-empty password, so old passwords still work", () => {
    expect(
      logInInput.safeParse({ email: "a@b.co", password: "x" }).success,
    ).toBe(true);
  });
});

describe("safeNext", () => {
  it("keeps a path on this site", () => {
    expect(safeNext("/reset-password")).toBe("/reset-password");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "",
    null,
  ])("falls back to / for %s", (value) => {
    expect(safeNext(value)).toBe("/");
  });
});

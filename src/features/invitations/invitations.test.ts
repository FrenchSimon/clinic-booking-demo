import { describe, expect, it, vi } from "vitest";
import { inviteInput, TOKEN_PATTERN } from "./schema";

vi.mock("server-only", () => ({}));
const { hashToken, newInviteToken } = await import("./token");

describe("inviteInput", () => {
  it("trims the name and lowercases the email", () => {
    expect(
      inviteInput.parse({
        name: "  Camille Peeters ",
        email: " Camille@Example.COM ",
      }),
    ).toEqual({ name: "Camille Peeters", email: "camille@example.com" });
  });

  it("refuses a missing name and an invalid email", () => {
    const result = inviteInput.safeParse({ name: "", email: "camille" });
    expect(result.success).toBe(false);
  });
});

describe("invitation tokens", () => {
  it("hashes like Postgres sha256() so the database finds the invitation", () => {
    // encode(sha256(convert_to('abc', 'UTF8')), 'hex') in Postgres
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("makes a 43-character URL-safe token and stores only its hash", () => {
    const { token, hash } = newInviteToken();
    expect(token).toMatch(TOKEN_PATTERN);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });

  it("never makes the same token twice", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => newInviteToken().token),
    );
    expect(tokens.size).toBe(50);
  });
});

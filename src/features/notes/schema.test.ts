import { describe, expect, it } from "vitest";
import { noteInput } from "./schema";

describe("noteInput", () => {
  it("trims the note", () => {
    expect(noteInput.parse({ body: "  Call the client  " })).toEqual({
      body: "Call the client",
    });
  });

  it("refuses an empty note", () => {
    expect(noteInput.safeParse({ body: "   " }).success).toBe(false);
  });

  it("refuses a note over 500 characters", () => {
    expect(noteInput.safeParse({ body: "a".repeat(501) }).success).toBe(false);
  });
});

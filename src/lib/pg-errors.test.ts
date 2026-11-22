import { describe, expect, it, vi } from "vitest";
import { isDeadlock, retryOnDeadlock } from "./pg-errors";

// Drizzle wraps the Postgres error, which carries the SQLSTATE in `code`.
function pgError(code: string) {
  const cause = Object.assign(new Error("postgres"), { code });
  return new Error("Failed query", { cause });
}

describe("isDeadlock", () => {
  it("finds SQLSTATE 40P01 in the error causes", () => {
    expect(isDeadlock(pgError("40P01"))).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isDeadlock(pgError("23P01"))).toBe(false);
    expect(isDeadlock(new Error("network"))).toBe(false);
    expect(isDeadlock("40P01")).toBe(false);
  });
});

describe("retryOnDeadlock", () => {
  it("returns the first result when there is no error", async () => {
    const run = vi.fn().mockResolvedValue("held");
    await expect(retryOnDeadlock(run)).resolves.toBe("held");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs again once after a deadlock", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(pgError("40P01"))
      .mockResolvedValue("held");
    await expect(retryOnDeadlock(run)).resolves.toBe("held");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("gives the retry's own error, such as the slot being taken", async () => {
    const taken = pgError("23P01");
    const run = vi
      .fn()
      .mockRejectedValueOnce(pgError("40P01"))
      .mockRejectedValue(taken);
    await expect(retryOnDeadlock(run)).rejects.toBe(taken);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors", async () => {
    const taken = pgError("23P01");
    const run = vi.fn().mockRejectedValue(taken);
    await expect(retryOnDeadlock(run)).rejects.toBe(taken);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

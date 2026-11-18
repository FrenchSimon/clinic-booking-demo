import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("./reminders", () => ({ sendTomorrowsReminders: vi.fn() }));
const { isCronRequest } = await import("./reminders-cron");

describe("isCronRequest", () => {
  const secret = "a-long-random-cron-secret";

  it("accepts Vercel's bearer token", () => {
    expect(isCronRequest(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("refuses a missing, wrong or bare token", () => {
    expect(isCronRequest(null, secret)).toBe(false);
    expect(isCronRequest("Bearer wrong", secret)).toBe(false);
    expect(isCronRequest(secret, secret)).toBe(false);
  });
});

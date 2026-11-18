import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { refundCancelled } = await import("./stripe-session");

function client(create: () => Promise<unknown>) {
  const spy = vi.fn(create);
  return { spy, stripe: { refunds: { create: spy } } as never };
}

describe("refundCancelled", () => {
  it("refunds the whole payment once, keyed by the booking", async () => {
    const { spy, stripe } = client(async () => ({ id: "re_1" }));
    expect(await refundCancelled(stripe, "b1", "pi_1")).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      { payment_intent: "pi_1", metadata: { booking_id: "b1" } },
      { idempotencyKey: "cancel-refund:b1" },
    );
  });

  it("counts a payment refunded by an earlier try as refunded", async () => {
    const { stripe } = client(async () => {
      throw Object.assign(new Error("refunded"), {
        code: "charge_already_refunded",
      });
    });
    expect(await refundCancelled(stripe, "b1", "pi_1")).toBe(true);
  });

  it("reports any other Stripe failure", async () => {
    const { stripe } = client(async () => {
      throw new Error("Stripe is down");
    });
    expect(await refundCancelled(stripe, "b1", "pi_1")).toBe(false);
  });
});

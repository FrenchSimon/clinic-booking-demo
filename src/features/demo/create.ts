import "server-only";
import { randomUUID } from "node:crypto";
import { brusselsToday } from "@/features/availability/schema";
import { brusselsInstant } from "@/features/booking/time";
import { adminDb } from "@/lib/db";
import { stripe } from "@/server/stripe";
import { type DemoBooking, demoBookings } from "./plan";
import { seedDemoClinic } from "./seed";

type Payable = Pick<DemoBooking, "priceCents"> & { id: string };

/**
 * Real test-mode payments for the sessions the owner can still cancel, so a
 * cancellation in the demo goes through a real Stripe refund (#12, #13).
 * A payment that fails leaves its session without one: the demo still
 * opens, that session just cannot be cancelled.
 */
async function payInTestMode(rows: Payable[]): Promise<Map<string, string>> {
  const client = stripe();
  const paid = new Map<string, string>();
  if (!client) return paid;
  const results = await Promise.allSettled(
    rows.map((b) =>
      client.paymentIntents.create(
        {
          amount: b.priceCents,
          currency: "eur",
          payment_method: "pm_card_visa", // Stripe's test card 4242
          // A card needs no redirect: the payment confirms on the server.
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          confirm: true,
          metadata: { booking_id: b.id, demo: "true" },
        },
        { idempotencyKey: `demo-payment:${b.id}` },
      ),
    ),
  );
  results.forEach((result, i) => {
    const id = rows[i]?.id;
    if (id && result.status === "fulfilled") paid.set(id, result.value.id);
  });
  return paid;
}

/** Creates the visitor's demo clinic, filled and paid (checklist #19). */
export async function createDemoClinic(
  visitorId: string,
  now = new Date(),
): Promise<string> {
  const startOfToday = brusselsInstant(brusselsToday(now), "00:00");
  const rows = demoBookings(now).map((b) => ({ ...b, id: randomUUID() }));
  const paid = await payInTestMode(
    rows.filter((b) => b.status === "confirmed" && b.startsAt >= startOfToday),
  );
  // adminDb: see seedDemoClinic(). Stripe is called first, so the
  // transaction stays short.
  return adminDb.transaction((tx) =>
    seedDemoClinic(
      tx,
      visitorId,
      rows.map((b) => ({ ...b, paymentIntentId: paid.get(b.id) ?? null })),
    ),
  );
}

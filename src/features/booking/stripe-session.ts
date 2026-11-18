import "server-only";
import type Stripe from "stripe";

// Shared by the webhook (R2.7) and the return page (R2.8): both settle a
// booking from a Checkout session they got from Stripe itself.

/** The payment of a paid Kinora session, or null for anything else. */
export function paidSession(
  session: Stripe.Checkout.Session,
): { sessionId: string; paymentIntentId: string } | null {
  // The Stripe account may serve other apps: only Kinora's sessions carry a
  // booking id (see checkout.ts).
  if (!session.metadata?.booking_id) return null;
  if (session.payment_status !== "paid") return null;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntent) return null;
  return { sessionId: session.id, paymentIntentId: paymentIntent };
}

/** Full refund of a payment that came after its slot was taken. */
export async function refundLatePayment(
  client: Stripe,
  bookingId: string,
  paymentIntent: string,
): Promise<void> {
  await client.refunds.create(
    { payment_intent: paymentIntent, metadata: { booking_id: bookingId } },
    // A retried event never refunds twice.
    { idempotencyKey: `refund:${bookingId}` },
  );
}

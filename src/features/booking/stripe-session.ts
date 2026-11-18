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

/**
 * Full refund of a booking the patient cancelled (R4.1). True once Stripe
 * holds the refund, including a refund made by an earlier try.
 */
export async function refundCancelled(
  client: Pick<Stripe, "refunds">,
  bookingId: string,
  paymentIntent: string,
): Promise<boolean> {
  try {
    await client.refunds.create(
      { payment_intent: paymentIntent, metadata: { booking_id: bookingId } },
      // Two clicks, or a retry within a day, never refund twice.
      { idempotencyKey: `cancel-refund:${bookingId}` },
    );
    return true;
  } catch (error) {
    // A retry after the key expired: the first refund went through.
    return isAlreadyRefunded(error);
  }
}

function isAlreadyRefunded(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "charge_already_refunded"
  );
}

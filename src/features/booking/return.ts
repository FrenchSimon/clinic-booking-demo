import "server-only";
import { adminDb } from "@/lib/db";
import { stripe } from "@/server/stripe";
import { settlePaidCheckout } from "./payment";
import { paidSession, refundLatePayment } from "./stripe-session";

/**
 * When the patient comes back from Stripe, asks Stripe whether the session
 * is paid and settles the booking then, so a paid booking shows as booked
 * even if the webhook is late (checklist #10). Returns true if it changed.
 */
export async function settleOnReturn(
  booking: {
    id: string;
    status: string;
    stripeCheckoutSessionId: string | null;
  },
  sessionId: string,
): Promise<boolean> {
  const waiting =
    booking.status === "pending_payment" || booking.status === "expired";
  if (!waiting || booking.stripeCheckoutSessionId !== sessionId) return false;
  const client = stripe();
  if (!client) return false;

  // Stripe's own answer, not the address, is the proof of payment.
  const session = await client.checkout.sessions.retrieve(sessionId);
  const paid = paidSession(session);
  if (!paid || session.metadata?.booking_id !== booking.id) return false;

  // adminDb, as in the webhook: the caller read the booking through RLS, so
  // it is the patient's own, and Stripe confirmed the payment. The event id
  // makes a reload, or the webhook arriving after, a no-op.
  const result = await adminDb.transaction((tx) =>
    settlePaidCheckout(
      tx,
      { eventId: `return:${sessionId}`, eventType: "checkout.return", ...paid },
      (bookingId, paymentIntent) =>
        refundLatePayment(client, bookingId, paymentIntent),
    ),
  );
  return result === "confirmed" || result === "refunded";
}

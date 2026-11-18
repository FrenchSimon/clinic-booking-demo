import "server-only";
import type Stripe from "stripe";
import { adminDb } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/server/stripe";
import { type PaidCheckout, settlePaidCheckout } from "./payment";
import { paidSession, refundLatePayment } from "./stripe-session";

// Events that mean a Checkout session is paid. Cards are paid at once;
// methods like Klarna confirm later with async_payment_succeeded.
const PAID_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

/** Answers one webhook call: checks Stripe's signature, then settles the booking. */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  const client = stripe();
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) {
    return new Response("Stripe is not configured", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // The raw body, exactly as sent: the signature covers every byte.
    const body = await request.text();
    event = await client.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const paid = paidCheckout(event);
  if (!paid) return Response.json({ received: true });

  // adminDb: Stripe calls this, not a signed-in user, and the signature
  // above is the access check. One transaction: settled and recorded together.
  const result = await adminDb.transaction((tx) =>
    settlePaidCheckout(tx, paid, (bookingId, paymentIntent) =>
      refundLatePayment(client, bookingId, paymentIntent),
    ),
  );
  return Response.json({ received: true, result });
}

function paidCheckout(event: Stripe.Event): PaidCheckout | null {
  if (!PAID_EVENTS.has(event.type)) return null;
  const paid = paidSession(event.data.object as Stripe.Checkout.Session);
  return paid ? { eventId: event.id, eventType: event.type, ...paid } : null;
}

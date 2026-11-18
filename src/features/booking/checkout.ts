import "server-only";
import { sql } from "drizzle-orm";
import { DEMO_VISITOR_EMAIL } from "@/features/email/outbox";
import { withRls } from "@/lib/db";
import { siteOrigin } from "@/server/site-origin";
import { stripe } from "@/server/stripe";
import type { BookingPage, PublicService } from "./public";

// Stripe Checkout lets a session live 30 minutes at least, longer than the
// 15-minute hold: a payment that arrives after the hold ran out is settled
// by the webhook (R2.7), which confirms it if the slot is still free and
// refunds it otherwise.
const CHECKOUT_MINUTES = 30;

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Creates the Stripe Checkout session of a hold and returns its URL. */
export async function startCheckout(input: {
  user: { id: string; email?: string };
  bookingId: string;
  page: BookingPage;
  service: PublicService;
  membershipId: string;
  choice: { day: string; at: string };
  /** The booking page with the patient's choice, for "back" on Stripe. */
  backTo: string;
}): Promise<string> {
  const client = stripe();
  if (!client) throw new Error("STRIPE_SECRET_KEY is not set");
  const { bookingId, page, service, choice } = input;
  const physio = page.physios.find((p) => p.id === input.membershipId);
  const day = dayFormat.format(new Date(`${choice.day}T12:00:00Z`));
  const when = `${day} at ${choice.at} with ${physio?.name ?? "your physio"}`;
  const origin = await siteOrigin();

  const session = await client.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: service.priceCents,
            product_data: {
              name: `${service.name} · ${page.name}`,
              description: when,
            },
          },
        },
      ],
      // An anonymous demo visitor has no address (an empty one, which
      // Stripe refuses): Checkout shows the one their emails go to in the
      // Outbox instead, read-only, so the two always match (#21).
      customer_email: input.user.email || DEMO_VISITOR_EMAIL,
      client_reference_id: bookingId,
      metadata: { booking_id: bookingId },
      payment_intent_data: { metadata: { booking_id: bookingId } },
      // Stripe runs in test mode only (env.ts): the card to use is shown
      // above the Pay button (checklist #21).
      custom_text: {
        submit: {
          message:
            "Test mode, no real payment: pay with card 4242 4242 4242 4242, any future date and any CVC.",
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60,
      success_url: `${origin}/bookings/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${input.backTo}`,
    },
    // A retried request for the same hold returns the same session.
    { idempotencyKey: `checkout:${bookingId}` },
  );

  const attached = await withRls(input.user.id, async (tx) => {
    const rows = await tx.execute<{ ok: boolean }>(
      sql`select private.attach_checkout(${bookingId}, ${session.id}) as ok`,
    );
    return rows[0]?.ok === true;
  });
  if (!attached || !session.url) throw new Error("Checkout not attached");
  return session.url;
}

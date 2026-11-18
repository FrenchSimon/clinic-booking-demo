"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SLUG_PATTERN } from "@/features/clinics/schema";
import { getUser, requireUser } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { stripe } from "@/server/stripe";
import { cancelAndRefund } from "./cancellation";
import { startCheckout } from "./checkout";
import { findSlot, holdSlot } from "./hold";
import { getBookingPage } from "./public";

const bookInput = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  service: z.uuid(),
  physio: z.union([z.literal("any"), z.uuid()]),
  day: z.iso.date(),
  at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export type BookingError = "taken" | "unavailable" | "payment" | "busy";

/**
 * "Continue to payment": checks the slot again, holds it for 15 minutes and
 * sends the patient to Stripe Checkout. A visitor signs in first and comes
 * back to the same choice.
 */
export async function bookAndPay(formData: FormData): Promise<void> {
  const parsed = bookInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/");
  const { slug, ...choice } = parsed.data;
  const backTo = `/c/${slug}?${new URLSearchParams(choice)}`;
  const fail: (error: BookingError) => never = (error) =>
    redirect(`${backTo}&error=${error}`);

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(backTo)}`);
  if (!(await rateLimit(`booking:hold:${user.id}`, 10))) fail("busy");
  if (!stripe()) fail("payment");

  const page = await getBookingPage(slug);
  const service = page?.services.find((s) => s.id === choice.service);
  if (!page || !service) fail("unavailable");
  const slot = await findSlot(page, service, choice);
  if (!slot) fail("taken");

  const held = await holdSlot(
    user.id,
    service.id,
    slot.membershipId,
    slot.startsAt,
  );
  if ("error" in held) fail(held.error);

  const url = await startCheckout({
    user,
    bookingId: held.id,
    page,
    service,
    membershipId: slot.membershipId,
    choice,
    backTo,
  });
  redirect(url);
}

const cancelInput = z.object({ booking: z.uuid() });

/**
 * "Cancel and refund" on the patient's booking page (checklist #12). The
 * 24-hour rule and the patient are checked by the database, not the page.
 */
export async function cancelMyBooking(formData: FormData): Promise<void> {
  const parsed = cancelInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/bookings");
  const user = await requireUser();
  const id = parsed.data.booking;
  const outcome = await cancelAndRefund(user.id, id);
  redirect(
    outcome === "refunded"
      ? `/bookings/${id}?cancelled=1`
      : `/bookings/${id}?error=${outcome}`,
  );
}

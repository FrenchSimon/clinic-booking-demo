import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BackLink } from "@/components/back-link";
import { BookingReceipt } from "@/features/booking/components/booking-receipt";
import {
  CANCEL_ERRORS,
  CancelSection,
} from "@/features/booking/components/cancel-section";
import type { EmailNotice } from "@/features/booking/components/email-notice";
import { getMyBooking } from "@/features/booking/queries";
import { settleOnReturn } from "@/features/booking/return";
import { requireUser } from "@/server/auth";

// Where Stripe sends the patient back after paying (R2.6), and the page of
// one booking, where the patient can cancel it (R4.1). Only its patient sees it.
export default function BookingPage({
  params,
  searchParams,
}: PageProps<"/bookings/[id]">) {
  return (
    <Suspense fallback={null}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Booking
          id={id}
          sessionId={query.session_id}
          confirming={query.cancel === "confirm"}
          justCancelled={query.cancelled === "1"}
          error={CANCEL_ERRORS[String(query.error)]}
        />
      ))}
    </Suspense>
  );
}

const sessionIdSchema = z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/);

async function Booking({
  id,
  sessionId,
  confirming,
  justCancelled,
  error,
}: {
  id: string;
  sessionId: string | string[] | undefined;
  confirming: boolean;
  justCancelled: boolean;
  error: string | undefined;
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser();
  let booking = await getMyBooking(user.id, id);
  if (!booking) notFound();

  const session = sessionIdSchema.safeParse(sessionId);
  if (session.success && (await settleOnReturn(booking, session.data))) {
    booking = (await getMyBooking(user.id, id)) ?? booking;
  }

  // An anonymous visitor is in their demo clinic: no address, the Outbox.
  const notice = emailNotice(
    booking.status,
    session.success,
    justCancelled,
    user.is_anonymous ? null : user.email,
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-xl px-4 py-5">
          <p className="font-heading font-semibold text-2xl text-primary">
            {booking.clinicName}
          </p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
        <BackLink href="/bookings" label="All your bookings" />
        {error && (
          <p role="alert" className="rounded-[14px] border bg-card p-4">
            {error}
          </p>
        )}
        <BookingReceipt booking={booking} notice={notice} />
        <CancelSection
          booking={booking}
          confirming={confirming}
          now={new Date()}
        />
        <p className="text-center text-muted-foreground text-xs">
          Booking by Kinora
        </p>
      </main>
    </div>
  );
}

/**
 * Tells the patient an email is coming (checklist #14), or that it is in the
 * demo's Outbox (#21), only on the page they land on right after paying
 * (back from Stripe) or after cancelling, not on every later visit.
 */
function emailNotice(
  status: string,
  backFromStripe: boolean,
  justCancelled: boolean,
  to: string | null | undefined,
): EmailNotice | undefined {
  if (to === undefined || to === "") return undefined;
  if (backFromStripe && status === "confirmed") return { kind: "booked", to };
  if (justCancelled && status === "refunded") return { kind: "cancelled", to };
  return undefined;
}

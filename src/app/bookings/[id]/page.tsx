import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { BookingReceipt } from "@/features/booking/components/booking-receipt";
import { getMyBooking } from "@/features/booking/queries";
import { settleOnReturn } from "@/features/booking/return";
import { requireUser } from "@/server/auth";

// Where Stripe sends the patient back after paying (R2.6), and the page of
// one booking. Only its patient sees it.
export default function BookingPage({
  params,
  searchParams,
}: PageProps<"/bookings/[id]">) {
  return (
    <Suspense fallback={null}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Booking id={id} sessionId={query.session_id} />
      ))}
    </Suspense>
  );
}

const sessionIdSchema = z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/);

async function Booking({
  id,
  sessionId,
}: {
  id: string;
  sessionId: string | string[] | undefined;
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requireUser();
  let booking = await getMyBooking(user.id, id);
  if (!booking) notFound();

  const session = sessionIdSchema.safeParse(sessionId);
  if (session.success && (await settleOnReturn(booking, session.data))) {
    booking = (await getMyBooking(user.id, id)) ?? booking;
  }

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
        <BookingReceipt booking={booking} />
        <Link
          href="/bookings"
          className="flex min-h-11 items-center self-center text-primary underline underline-offset-4"
        >
          All your bookings
        </Link>
        <p className="text-center text-muted-foreground text-xs">
          Booking by Kinora
        </p>
      </main>
    </div>
  );
}

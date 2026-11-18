import Link from "next/link";
import { Suspense } from "react";
import { BookingList } from "@/features/booking/components/booking-list";
import { listMyBookings } from "@/features/booking/queries";
import { requireUser } from "@/server/auth";

// The patient's upcoming and past bookings (checklist #11). Only their own:
// the query filters on them and row level security enforces it.
export default function MyBookingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-xl px-4 py-5">
          <Link
            href="/"
            className="font-heading font-semibold text-2xl text-primary"
          >
            Kinora
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
        <h1 className="font-heading font-normal text-3xl">Your bookings</h1>
        <Suspense fallback={null}>
          <Lists />
        </Suspense>
      </main>
    </div>
  );
}

async function Lists() {
  const user = await requireUser();
  const { upcoming, past } = await listMyBookings(user.id);
  return (
    <>
      <BookingList
        title="Upcoming"
        bookings={upcoming}
        empty="No session to come. Book one from your clinic's page."
      />
      <BookingList
        title="Past and cancelled"
        bookings={past}
        empty="Nothing here yet."
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BookingList } from "@/features/booking/components/booking-list";
import { listMyBookings } from "@/features/booking/queries";
import { fill } from "@/i18n/locale";
import { getDictionary } from "@/i18n/server";
import { requireUser } from "@/server/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.booking.mine.title}${t.meta.suffix}` };
}

// The patient's upcoming and past bookings (checklist #11). Only their own:
// the query filters on them and row level security enforces it.
export default async function MyBookingsPage() {
  const { t } = await getDictionary();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-heading font-semibold text-2xl text-primary"
          >
            Kinora
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
        <h1 className="font-heading font-normal text-3xl">
          {t.booking.mine.title}
        </h1>
        <Suspense fallback={null}>
          <Lists />
        </Suspense>
      </main>
    </div>
  );
}

async function Lists() {
  const user = await requireUser();
  const { t: all } = await getDictionary();
  const t = all.booking.mine;
  const { upcoming, past } = await listMyBookings(user.id);
  // The clinics the patient booked at, each once: the way back to booking.
  const clinics = new Map(
    [...upcoming, ...past].map((b) => [b.clinicSlug, b.clinicName]),
  );
  return (
    <>
      {[...clinics].map(([slug, name]) => (
        <Link
          key={slug}
          href={`/c/${slug}`}
          className={buttonVariants({ size: "lg", className: "self-start" })}
        >
          {fill(t.bookAt, { clinic: name })}
        </Link>
      ))}
      <BookingList
        id="upcoming-title"
        title={t.upcoming}
        bookings={upcoming}
        empty={t.upcomingEmpty}
      />
      <BookingList
        id="past-and-cancelled-title"
        title={t.past}
        bookings={past}
        empty={t.pastEmpty}
      />
    </>
  );
}

import Link from "next/link";
import { StatusPill } from "@/features/booking/components/status-pill";
import type { UpcomingBooking } from "../queries";

const when = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/Brussels",
});

/** The clinic's sessions from today on; each row opens the booking. */
export function UpcomingBookings({
  bookings,
}: {
  bookings: UpcomingBooking[];
}) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-[14px] border bg-card p-5 text-muted-foreground">
        No session booked from today on.
      </p>
    );
  }
  return (
    <ul className="flex flex-col overflow-hidden rounded-[14px] border bg-card">
      {bookings.map((b) => (
        <li key={b.id} className="border-divider border-b last:border-b-0">
          <Link
            href={`/clinic/bookings/${b.id}`}
            className="flex min-h-11 flex-col gap-1 p-4 focus-visible:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">{when.format(b.startsAt)}</span>
              <span className="break-all text-sm sm:truncate">
                {b.patientEmail ?? "Staff booking"}
              </span>
              <span className="text-muted-foreground text-sm">
                {b.serviceName} · {b.physioName ?? "Physio"}
              </span>
            </span>
            <span className="self-start sm:self-center">
              <StatusPill status={b.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

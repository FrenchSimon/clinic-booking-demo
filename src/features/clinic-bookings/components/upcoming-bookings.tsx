import Link from "next/link";
import { StatusPill } from "@/features/booking/components/status-pill";
import { dateFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { UpcomingBooking } from "../queries";

/** The clinic's sessions from today on; each row opens the booking. */
export async function UpcomingBookings({
  bookings,
}: {
  bookings: UpcomingBooking[];
}) {
  const { locale, t } = await getDictionary();
  const when = dateFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  if (bookings.length === 0) {
    return (
      <p className="rounded-[14px] border bg-card p-5 text-muted-foreground">
        {t.clinic.bookings.empty}
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
                {b.patientEmail ?? t.clinic.common.staffBooking}
              </span>
              <span className="text-muted-foreground text-sm">
                {b.serviceName} · {b.physioName ?? t.clinic.common.physio}
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

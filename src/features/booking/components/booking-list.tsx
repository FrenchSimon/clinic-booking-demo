import Link from "next/link";
import { dateFormat } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import type { MyBookingItem } from "../queries";
import { StatusPill } from "./status-pill";

const WHEN: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

/** One section of the patient's bookings; each row opens the booking. */
export async function BookingList({
  id,
  title,
  bookings,
  empty,
}: {
  /** The heading's id, the same in both languages. */
  id: string;
  title: string;
  bookings: MyBookingItem[];
  empty: string;
}) {
  const { locale, t } = await getDictionary();
  const when = dateFormat(locale, WHEN);
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-heading font-semibold text-xl">
        {title}
      </h2>
      {bookings.length === 0 ? (
        <p className="rounded-[14px] border bg-card p-5 text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-[14px] border bg-card">
          {bookings.map((b) => (
            <li key={b.id} className="border-divider border-b last:border-b-0">
              <Link
                href={`/bookings/${b.id}`}
                className="flex min-h-11 flex-col gap-1 p-4 focus-visible:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">
                    {when.format(b.startsAt)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {b.serviceName} · {b.physioName ?? t.booking.mine.physio} ·{" "}
                    {b.clinicName}
                  </span>
                </span>
                <span className="self-start sm:self-center">
                  <StatusPill status={b.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

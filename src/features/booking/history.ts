import type { BookingStatus } from "./table";

type HistoryRow = {
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  holdExpiresAt: Date | null;
};

/**
 * The patient's bookings in two lists (checklist #11). Upcoming: sessions
 * that have not ended and still take the physio's time, soonest first.
 * Past: sessions that are over, cancelled or refunded, latest first.
 * Holds that were never paid are not bookings and are left out, even when
 * nobody has marked them expired yet (that happens on the next hold).
 */
export function splitBookings<T extends HistoryRow>(rows: T[], now: Date) {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const row of rows) {
    if (row.status === "expired" || lapsedHold(row, now)) continue;
    const holding =
      row.status === "confirmed" || row.status === "pending_payment";
    if (holding && row.endsAt > now) upcoming.push(row);
    else past.push(row);
  }
  upcoming.sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime());
  past.sort((x, y) => y.startsAt.getTime() - x.startsAt.getTime());
  return { upcoming, past };
}

/** A hold whose 15 minutes are over: never paid, so not a booking. */
export function lapsedHold(row: HistoryRow, now: Date) {
  return (
    row.status === "pending_payment" &&
    (row.holdExpiresAt === null || row.holdExpiresAt <= now)
  );
}

const DAY_MS = 24 * 60 * 60_000;

/**
 * Whether the patient may still cancel online: a paid session at least 24
 * hours away (checklist #12). Only for the page: private.cancel_booking()
 * checks the rule again on the database's clock.
 */
export function canCancel(
  row: { status: BookingStatus; startsAt: Date },
  now: Date,
) {
  return (
    row.status === "confirmed" &&
    row.startsAt.getTime() - DAY_MS >= now.getTime()
  );
}

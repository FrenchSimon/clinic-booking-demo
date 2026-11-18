import { lapsedHold } from "@/features/booking/history";
import type { BookingStatus } from "@/features/booking/table";
import { addDays, brusselsInstant, weekday } from "@/features/booking/time";
import type { Day } from "@/features/clinics/schema";

// The owner's figures (checklist #16). Every period is a Brussels calendar
// range, and a booking counts in the period its session starts in: the
// bookings table keeps no cancellation date, so the session date is the one
// date every booking has.

const WEEK: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export type Period = { from: Date; to: Date };

/** Today, this week (Monday to Sunday) and this month, for a Brussels day. */
export function dashboardPeriods(today: string) {
  const monday = addDays(today, -WEEK.indexOf(weekday(today)));
  const [year = 0, month = 1] = today.split("-").map(Number);
  // Date.UTC rolls month 12 over to January of the next year.
  const nextMonth = new Date(Date.UTC(year, month, 1))
    .toISOString()
    .slice(0, 10);
  const range = (from: string, to: string): Period => ({
    from: brusselsInstant(from, "00:00"),
    to: brusselsInstant(to, "00:00"),
  });
  return {
    today: range(today, addDays(today, 1)),
    week: range(monday, addDays(monday, 7)),
    month: range(`${today.slice(0, 8)}01`, nextMonth),
  };
}

export type Periods = ReturnType<typeof dashboardPeriods>;

/** The smallest range holding all three periods: what to read from the database. */
export function readRange(periods: Periods): Period {
  const { week, month } = periods;
  return {
    from: week.from < month.from ? week.from : month.from,
    to: week.to > month.to ? week.to : month.to,
  };
}

type FigureRow = {
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  holdExpiresAt: Date | null;
  priceCents: number;
};

const within = (row: FigureRow, p: Period) =>
  row.startsAt >= p.from && row.startsAt < p.to;

/**
 * Paid bookings today and this week, what this month's paid sessions bring
 * in, and this month's cancellations with the amount refunded. Today's
 * sessions list every booking of the day except holds that were never paid.
 */
export function dashboardFigures<T extends FigureRow>(
  rows: T[],
  periods: Periods,
  now: Date,
) {
  const paid = rows.filter((r) => r.status === "confirmed");
  const month = rows.filter((r) => within(r, periods.month));
  const closed = month.filter(
    (r) => r.status === "cancelled" || r.status === "refunded",
  );
  return {
    todayCount: paid.filter((r) => within(r, periods.today)).length,
    weekCount: paid.filter((r) => within(r, periods.week)).length,
    revenueCents: sum(paid.filter((r) => within(r, periods.month))),
    cancelledCount: closed.length,
    refundedCents: sum(closed.filter((r) => r.status === "refunded")),
    todaySessions: rows
      .filter((r) => within(r, periods.today))
      .filter((r) => r.status !== "expired" && !lapsedHold(r, now))
      .sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime()),
  };
}

function sum(rows: FigureRow[]) {
  return rows.reduce((total, r) => total + r.priceCents, 0);
}

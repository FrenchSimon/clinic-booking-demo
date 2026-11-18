import { lapsedHold } from "@/features/booking/history";
import type { BookingStatus } from "@/features/booking/table";
import { addDays } from "@/features/booking/time";

// The physio's agenda (checklist #17): today's sessions, then the other days
// of the week from Monday to Sunday, in Brussels time.

type AgendaRow = {
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  holdExpiresAt: Date | null;
};

const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" });

/**
 * Splits the week's sessions into today and the other days that have one,
 * each sorted by time. Holds that were never paid are not sessions.
 */
export function groupAgenda<T extends AgendaRow>(
  rows: T[],
  today: string,
  monday: string,
  now: Date,
) {
  const sessions = rows
    .filter((r) => r.status !== "expired" && !lapsedHold(r, now))
    .sort((x, y) => x.startsAt.getTime() - y.startsAt.getTime());
  const on = (date: string) =>
    sessions.filter((r) => dayOf.format(r.startsAt) === date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return {
    today: on(today),
    week: days
      .filter((date) => date !== today)
      .map((date) => ({ date, sessions: on(date) }))
      .filter((day) => day.sessions.length > 0),
  };
}

// Everything runs in Europe/Brussels (checklist: one time zone). Dates are
// calendar days as "2026-11-24", times are wall-clock "09:30", and instants
// are Date objects. These helpers convert between them across DST changes.

import type { Day } from "@/features/clinics/schema";

const ZONE = "Europe/Brussels";
const WEEKDAYS: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Brussels' offset from UTC at this instant, in milliseconds (+1 h or +2 h). */
function offsetAt(ms: number): number {
  const p: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const x of parts.formatToParts(ms)) p[x.type] = Number(x.value);
  const wall = Date.UTC(
    p.year ?? 0,
    (p.month ?? 1) - 1,
    p.day ?? 1,
    p.hour ?? 0,
    p.minute ?? 0,
  );
  return wall - Math.floor(ms / 60_000) * 60_000;
}

/** "2026-11-24" at "09:30" in Brussels → the instant. */
export function brusselsInstant(date: string, time: string): Date {
  const [y = 0, mo = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  // The offset at the guess is right except within an hour of a DST change:
  // a second pass with the offset of the first result settles it.
  const first = wall - offsetAt(wall);
  return new Date(wall - offsetAt(first));
}

/** The weekday of a calendar day: "2026-11-24" → "tue". */
export function weekday(date: string): Day {
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()] ?? "mon";
}

/** The calendar day `n` days after this one: ("2026-11-30", 1) → "2026-12-01". */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "09:30" → 570 minutes after midnight. */
export function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 570 → "09:30". */
export function fromMinutes(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${h}:${String(minutes % 60).padStart(2, "0")}`;
}

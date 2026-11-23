import { z } from "zod";
import { DAYS, type OpeningHours } from "@/features/clinics/schema";
import { team } from "@/i18n/en/team";
import { fill } from "@/i18n/locale";

const v = team.hoursValidation;

type OutsideStrings = Pick<typeof team, "hoursErrors" | "days">;

// Shared by the forms (instant feedback) and the Server Actions (the real check).

/** Today in Brussels, as "2026-11-18". */
export function brusselsToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
  }).format(now);
}

/**
 * Errors for the days a physio works outside the clinic's opening hours,
 * keyed like the form fields: "weeklyHours.mon.from".
 */
export function outsideOpeningHours(
  hours: OpeningHours,
  clinic: OpeningHours,
  t: OutsideStrings = team,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const day of DAYS) {
    const mine = hours[day];
    const open = clinic[day];
    if (!mine.open) continue;
    if (!open.open) {
      errors[`weeklyHours.${day}.from`] = fill(t.hoursErrors.closedOn, {
        day: t.days[day],
      });
    } else if (mine.from < open.from || mine.to > open.to) {
      errors[`weeklyHours.${day}.from`] = fill(t.hoursErrors.openOn, {
        from: open.from,
        to: open.to,
        day: t.days[day],
      });
    }
  }
  return errors;
}

const isoDate = z.iso.date(v.pickDay);

/** A day off, or several in a row. Both days are included. */
export function dayOffInput(today: string) {
  return z
    .object({ startsOn: isoDate, endsOn: isoDate })
    .refine((d) => d.startsOn >= today, {
      message: v.notPast,
      path: ["startsOn"],
    })
    .refine((d) => d.endsOn >= d.startsOn, {
      message: v.lastAfterFirst,
      path: ["endsOn"],
    })
    .refine((d) => daysBetween(d.startsOn, d.endsOn) < 366, {
      message: v.oneYear,
      path: ["endsOn"],
    });
}

function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}

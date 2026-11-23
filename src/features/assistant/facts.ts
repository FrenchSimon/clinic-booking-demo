import type { BookingPage } from "@/features/booking/public";
import { BOOKING_DAYS } from "@/features/booking/selection";
import { addDays, weekday } from "@/features/booking/time";
import { DAYS, type Day } from "@/features/clinics/schema";
import { formatEuros } from "@/features/services/schema";
import { dateFormat } from "@/i18n/format";
import type { Locale } from "@/i18n/locale";

// The only things the assistant knows about the clinic: what the public
// booking page already shows. No booking, no patient, no other clinic.
// The labels are for the model and stay in English; the dates, weekdays and
// prices are in the visitor's language, so the model can repeat them as is.

const noon = (date: string) => new Date(`${date}T12:00:00Z`);

/** "Wednesday, 18 November 2026" (or "mercredi 18 novembre 2026") for "2026-11-18". */
export function longDate(date: string, locale: Locale = "en"): string {
  return dateFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon(date));
}

/** "Monday" or "lundi": 2026-11-23 is a Monday, DAYS starts on Monday. */
function weekdayName(day: Day, locale: Locale): string {
  return dateFormat(locale, { weekday: "long" }).format(
    noon(addDays("2026-11-23", DAYS.indexOf(day))),
  );
}

/** The clinic's public information as plain text, for the system prompt. */
export function clinicFacts(
  page: BookingPage,
  today: string,
  locale: Locale = "en",
): string {
  const hours = DAYS.map((day) => {
    const h = page.openingHours[day];
    return `- ${weekdayName(day, locale)}: ${h.open ? `${h.from} to ${h.to}` : "closed"}`;
  });
  const names = new Map(page.physios.map((p) => [p.id, p.name]));
  const services = page.services.map((s) => {
    const physios = s.physioIds.map((id) => names.get(id)).filter(Boolean);
    return `- ${s.name}: ${s.durationMinutes} min, ${formatEuros(s.priceCents, locale)}, with ${physios.join(", ") || "no physio yet"}`;
  });
  return [
    `Clinic: ${page.name}`,
    `Address: ${page.address}`,
    `Today: ${longDate(today, locale)} (${today}), time zone Europe/Brussels`,
    `Next days: ${calendar(today, locale)}`,
    "Opening hours:",
    ...hours,
    "Sessions (name: duration, price, physios):",
    ...(services.length ? services : ["- none bookable online yet"]),
    "Payment: online by card when booking.",
    "Cancellation: up to 24 hours before the session, with a full refund to the card.",
    "Reminder: an email the day before the session.",
  ].join("\n");
}

/** "Thursday 2026-11-19, Friday 2026-11-20…": the dates the slot tool takes. */
function calendar(today: string, locale: Locale): string {
  return Array.from({ length: BOOKING_DAYS }, (_, i) => {
    const date = addDays(today, i);
    return `${weekdayName(weekday(date), locale)} ${date}`;
  }).join(", ");
}

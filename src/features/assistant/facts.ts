import type { BookingPage } from "@/features/booking/public";
import { BOOKING_DAYS } from "@/features/booking/selection";
import { addDays, weekday } from "@/features/booking/time";
import { DAY_LABELS, DAYS } from "@/features/clinics/schema";
import { formatEuros } from "@/features/services/schema";

// The only things the assistant knows about the clinic: what the public
// booking page already shows. No booking, no patient, no other clinic.

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "Wednesday, 18 November 2026" for "2026-11-18". */
export function longDate(date: string): string {
  return dateFormat.format(new Date(`${date}T12:00:00Z`));
}

/** The clinic's public information as plain text, for the system prompt. */
export function clinicFacts(page: BookingPage, today: string): string {
  const hours = DAYS.map((day) => {
    const h = page.openingHours[day];
    return `- ${DAY_LABELS[day]}: ${h.open ? `${h.from} to ${h.to}` : "closed"}`;
  });
  const names = new Map(page.physios.map((p) => [p.id, p.name]));
  const services = page.services.map((s) => {
    const physios = s.physioIds.map((id) => names.get(id)).filter(Boolean);
    return `- ${s.name}: ${s.durationMinutes} min, ${formatEuros(s.priceCents)}, with ${physios.join(", ") || "no physio yet"}`;
  });
  return [
    `Clinic: ${page.name}`,
    `Address: ${page.address}`,
    `Today: ${longDate(today)} (${today}), time zone Europe/Brussels`,
    `Next days: ${calendar(today)}`,
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
function calendar(today: string): string {
  return Array.from({ length: BOOKING_DAYS }, (_, i) => {
    const date = addDays(today, i);
    return `${DAY_LABELS[weekday(date)]} ${date}`;
  }).join(", ");
}

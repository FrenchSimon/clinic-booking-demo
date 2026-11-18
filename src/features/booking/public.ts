import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { openingHoursSchema } from "@/features/clinics/schema";
import { withAnon } from "@/lib/db";
import type { Busy, PhysioSchedule } from "./slots";

// What a visitor may read, through private.booking_page() and
// private.booking_availability() (drizzle/0012). Parsed with Zod: the
// functions return JSON, and the page should fail loudly if it changes.

const bookingPage = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  openingHours: openingHoursSchema,
  services: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      durationMinutes: z.number().int(),
      priceCents: z.number().int(),
      physioIds: z.array(z.uuid()),
    }),
  ),
  physios: z.array(z.object({ id: z.uuid(), name: z.string() })),
});

export type BookingPage = z.infer<typeof bookingPage>;
export type PublicService = BookingPage["services"][number];

const availability = z.object({
  schedules: z.array(
    z.object({
      membershipId: z.uuid(),
      weeklyHours: openingHoursSchema,
      daysOff: z.array(
        z.object({ startsOn: z.iso.date(), endsOn: z.iso.date() }),
      ),
    }),
  ),
  busy: z.array(
    z.object({
      membershipId: z.uuid(),
      startsAt: z.coerce.date(),
      endsAt: z.coerce.date(),
    }),
  ),
});

/** The clinic's public booking page, or null for an unknown address. */
export async function getBookingPage(
  slug: string,
): Promise<BookingPage | null> {
  const rows = await withAnon((tx) =>
    tx.execute<{ page: unknown }>(
      sql`select private.booking_page(${slug}) as page`,
    ),
  );
  const page = rows[0]?.page;
  return page ? bookingPage.parse(page) : null;
}

/** Physio schedules and busy times between two instants, for freeSlots(). */
export async function getAvailability(
  clinicId: string,
  from: Date,
  to: Date,
): Promise<{ schedules: PhysioSchedule[]; busy: Busy[] }> {
  const rows = await withAnon((tx) =>
    tx.execute<{ data: unknown }>(
      sql`select private.booking_availability(${clinicId}, ${from.toISOString()}, ${to.toISOString()}) as data`,
    ),
  );
  return availability.parse(rows[0]?.data);
}

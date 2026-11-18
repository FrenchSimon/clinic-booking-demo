import "server-only";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { brusselsToday } from "@/features/availability/schema";
import { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import { services } from "@/features/services/table";
import { withRls } from "@/lib/db";
import {
  dashboardFigures,
  dashboardPeriods,
  type Period,
  readRange,
} from "./figures";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

/**
 * The clinic's bookings whose session starts in this range, never-paid holds
 * aside. Runs inside a withRls() transaction: an owner gets the whole clinic,
 * a physio only their own sessions, anyone else nothing.
 */
export function clinicBookings(tx: Tx, clinicId: string, range: Period) {
  return tx
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      holdExpiresAt: bookings.holdExpiresAt,
      priceCents: bookings.priceCents,
      serviceName: services.name,
      physioName: memberships.displayName,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(
      and(
        eq(bookings.clinicId, clinicId),
        gte(bookings.startsAt, range.from),
        lt(bookings.startsAt, range.to),
        ne(bookings.status, "expired"),
      ),
    );
}

export type ClinicBooking = Awaited<ReturnType<typeof clinicBookings>>[number];

/** The owner's dashboard figures for today (checklist #16). Read through RLS. */
export async function getDashboard(
  userId: string,
  clinicId: string,
  now = new Date(),
) {
  const today = brusselsToday(now);
  const periods = dashboardPeriods(today);
  const rows = await withRls(userId, (tx) =>
    clinicBookings(tx, clinicId, readRange(periods)),
  );
  return { today, ...dashboardFigures(rows, periods, now) };
}

import "server-only";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { brusselsToday } from "@/features/availability/schema";
import { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import { clinicPatients } from "@/features/patients/queries";
import { services } from "@/features/services/table";
import { withRls } from "@/lib/db";
import {
  dashboardFigures,
  dashboardPeriods,
  type Period,
  readRange,
} from "./figures";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

// The patient's membership in the clinic, to find their email in the
// patient list: the bookings table only holds their account id.
const patient = alias(memberships, "patient");

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
      patientMembershipId: patient.id,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .leftJoin(
      patient,
      and(
        eq(patient.clinicId, bookings.clinicId),
        eq(patient.userId, bookings.patientId),
      ),
    )
    .where(
      and(
        eq(bookings.clinicId, clinicId),
        gte(bookings.startsAt, range.from),
        lt(bookings.startsAt, range.to),
        ne(bookings.status, "expired"),
      ),
    );
}

/**
 * The owner's dashboard figures for today (checklist #16), each of today's
 * sessions with its patient's email. Read through RLS in one transaction.
 */
export async function getDashboard(
  userId: string,
  clinicId: string,
  now = new Date(),
) {
  const today = brusselsToday(now);
  const periods = dashboardPeriods(today);
  const { rows, patients } = await withRls(userId, async (tx) => ({
    rows: await clinicBookings(tx, clinicId, readRange(periods)),
    patients: await clinicPatients(tx, clinicId, now),
  }));
  const emails = new Map(patients.map((p) => [p.id, p.email]));
  const { todaySessions, ...figures } = dashboardFigures(rows, periods, now);
  return {
    today,
    ...figures,
    todaySessions: todaySessions.map((s) => ({
      ...s,
      // Staff who book for themselves are not in the patient list.
      patientEmail: emails.get(s.patientMembershipId ?? "") ?? null,
    })),
  };
}

export type TodaySession = Awaited<
  ReturnType<typeof getDashboard>
>["todaySessions"][number];

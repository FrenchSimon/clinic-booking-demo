import "server-only";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { brusselsToday } from "@/features/availability/schema";
import { bookings } from "@/features/booking/table";
import { memberships } from "@/features/clinics/table";
import { dashboardPeriods, type Period } from "@/features/dashboard/figures";
import { services } from "@/features/services/table";
import { withRls } from "@/lib/db";
import { groupAgenda } from "./agenda";

type Tx = Parameters<Parameters<typeof withRls>[1]>[0];

/**
 * This user's own sessions in the clinic whose start falls in the range,
 * expired holds aside. Runs inside a withRls() transaction: the bookings
 * policy already limits a physio to their own sessions (checklist #17), and
 * the membership join keeps an owner's agenda to the sessions they give.
 */
export function agendaBookings(
  tx: Tx,
  userId: string,
  clinicId: string,
  range: Period,
) {
  return tx
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      holdExpiresAt: bookings.holdExpiresAt,
      patientId: bookings.patientId,
      serviceName: services.name,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(
      and(
        eq(bookings.clinicId, clinicId),
        eq(memberships.userId, userId),
        gte(bookings.startsAt, range.from),
        lt(bookings.startsAt, range.to),
        ne(bookings.status, "expired"),
      ),
    );
}

const agendaPatients = z.array(
  z.object({ userId: z.uuid(), email: z.string() }),
);

/**
 * The email of each patient who booked with this user, through
 * private.agenda_patients() (drizzle/0017): auth.users is not readable
 * through row level security.
 */
export async function agendaPatientEmails(tx: Tx, clinicId: string) {
  const rows = await tx.execute<{ list: unknown }>(
    sql`select private.agenda_patients(${clinicId}) as list`,
  );
  return agendaPatients.parse(rows[0]?.list);
}

/** The physio's agenda for today and this week (checklist #17). */
export async function getAgenda(
  userId: string,
  clinicId: string,
  now = new Date(),
) {
  const today = brusselsToday(now);
  const { week } = dashboardPeriods(today);
  const { rows, patients } = await withRls(userId, async (tx) => ({
    rows: await agendaBookings(tx, userId, clinicId, week),
    patients: await agendaPatientEmails(tx, clinicId),
  }));
  const emails = new Map(patients.map((p) => [p.userId, p.email]));
  const withEmail = rows.map((r) => ({
    ...r,
    patientEmail: emails.get(r.patientId) ?? null,
  }));
  const monday = brusselsToday(week.from);
  return { date: today, ...groupAgenda(withEmail, today, monday, now) };
}

export type AgendaSession = Awaited<
  ReturnType<typeof getAgenda>
>["today"][number];

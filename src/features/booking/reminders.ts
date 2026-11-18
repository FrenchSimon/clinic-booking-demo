import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { authUsers } from "drizzle-orm/supabase";
import type * as schema from "@/db/schema";
import { clinics, memberships } from "@/features/clinics/table";
import {
  DEMO_VISITOR_EMAIL,
  deliverEmail,
  queueEmail,
} from "@/features/email/outbox";
import { services } from "@/features/services/table";
import { adminDb } from "@/lib/db";
import { reminderEmail } from "./email";
import { bookings } from "./table";

type Db = Pick<PostgresJsDatabase<typeof schema>, "select" | "insert">;

// Midnight in Brussels, `days` after the day `now` falls on there.
const brusselsMidnight = (now: Date, days: number) =>
  sql`((date_trunc('day', ${now.toISOString()}::timestamptz at time zone 'Europe/Brussels') + ${`${days} days`}::interval) at time zone 'Europe/Brussels')`;

/**
 * Queues the reminder of every confirmed session tomorrow, in Brussels time
 * (checklist #15). A cancelled or refunded booking is not "confirmed", so it
 * never gets one. The dedupe key "booking_reminder:<booking id>" is unique:
 * a second run, even at the same moment, queues nothing for a booking that
 * already has its reminder. Returns the ids of the emails this run queued.
 */
export async function queueTomorrowsReminders(
  db: Db,
  now: Date,
  origin: string,
): Promise<string[]> {
  const due = await db
    .select({
      id: bookings.id,
      clinicId: bookings.clinicId,
      startsAt: bookings.startsAt,
      patientEmail: authUsers.email,
      serviceName: services.name,
      physioName: memberships.displayName,
      clinicName: clinics.name,
      clinicAddress: clinics.address,
    })
    .from(bookings)
    .innerJoin(authUsers, eq(authUsers.id, bookings.patientId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(clinics, eq(clinics.id, bookings.clinicId))
    .innerJoin(memberships, eq(memberships.id, bookings.membershipId))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gte(bookings.startsAt, brusselsMidnight(now, 1)),
        lt(bookings.startsAt, brusselsMidnight(now, 2)),
      ),
    );

  const queued: string[] = [];
  for (const booking of due) {
    const id = await queueEmail(db, {
      clinicId: booking.clinicId,
      kind: "booking_reminder",
      dedupeKey: `booking_reminder:${booking.id}`,
      to: booking.patientEmail ?? DEMO_VISITOR_EMAIL,
      content: reminderEmail({
        ...booking,
        link: `${origin}/bookings/${booking.id}`,
      }),
    });
    if (id) queued.push(id);
  }
  return queued;
}

/**
 * The daily job: queues tomorrow's reminders, then sends the ones this run
 * queued. adminDb: a job runs without a signed-in user. One at a time, to
 * stay under Resend's rate limit.
 */
export async function sendTomorrowsReminders(
  now: Date,
  origin: string,
): Promise<{ queued: number; sent: number }> {
  const ids = await queueTomorrowsReminders(adminDb, now, origin);
  let sent = 0;
  for (const id of ids) {
    if ((await deliverEmail(id)) === "sent") sent += 1;
  }
  return { queued: ids.length, sent };
}
